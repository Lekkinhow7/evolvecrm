import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import pg from 'pg'

import { resolveMigrationTarget, resolveSqlPath } from './guards.mjs'

const { Client } = pg
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..', '..')

function flag(name) {
  const prefix = `--${name}=`
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length)
}

async function assertBaseTables(client, database) {
  const required = database === 'agent'
    ? ['succaozero_profissionais', 'succaozero_disponibilidade_semanal', 'succaozero_slots_horarios']
    : ['organizations', 'profiles', 'boards', 'board_stages', 'contacts', 'deals', 'activities']
  const { rows } = await client.query(
    `select c.relname
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = any($1::text[])`,
    [required],
  )
  const found = new Set(rows.map((row) => row.relname))
  const missing = required.filter((table) => !found.has(table))
  if (missing.length) throw new Error(`Banco ${database} não possui tabelas-base: ${missing.join(', ')}`)
}

async function captureAgentCounts(client) {
  const { rows: [row] } = await client.query(`
    select
      (select count(*)::integer from public.succaozero_disponibilidade_semanal) as disponibilidades,
      (select count(*)::integer from public.succaozero_slots_horarios) as slots
  `)
  return { disponibilidades: Number(row.disponibilidades), slots: Number(row.slots) }
}

async function main() {
  const requestedPath = process.argv[2]
  if (!requestedPath || requestedPath.startsWith('--')) {
    throw new Error('Informe o caminho da migration SQL')
  }

  const database = flag('database') || 'crm'
  const environment = flag('environment')
  const confirmProject = flag('confirm-project')
  const sqlPath = resolveSqlPath(repoRoot, requestedPath)
  const target = resolveMigrationTarget({ database, environment, confirmProject })
  const sql = await readFile(sqlPath, 'utf8')
  const version = path.basename(sqlPath)
  const sha256 = createHash('sha256').update(sql).digest('hex')
  const client = new Client({
    connectionString: target.connectionString,
    ssl: { rejectUnauthorized: false },
  })

  console.log(`database=${target.database}`)
  console.log(`environment=${target.environment}`)
  console.log(`project_ref=${target.projectRef}`)
  console.log(`migration=${version}`)

  await client.connect()
  try {
    await client.query('begin')
    await client.query(`select set_config('app.succaozero_project_ref', $1, true)`, [target.projectRef])
    await assertBaseTables(client, target.database)
    await client.query(`
      create table if not exists public.succaozero_schema_migrations (
        version text primary key,
        sha256 text not null,
        database_kind text not null check (database_kind in ('crm', 'agent')),
        project_ref text not null,
        metadata jsonb not null default '{}'::jsonb,
        applied_at timestamptz not null default now()
      );
      alter table public.succaozero_schema_migrations enable row level security;
      alter table public.succaozero_schema_migrations force row level security;
      revoke all on public.succaozero_schema_migrations from anon, authenticated;
    `)

    const existing = await client.query(
      'select sha256, project_ref, database_kind from public.succaozero_schema_migrations where version = $1',
      [version],
    )
    if (existing.rowCount) {
      const row = existing.rows[0]
      if (row.sha256 !== sha256 || row.project_ref !== target.projectRef || row.database_kind !== target.database) {
        throw new Error('Migration já registrada com hash, projeto ou banco diferente')
      }
      await client.query('rollback')
      console.log('status=already_applied')
      return
    }

    const before = target.database === 'agent' ? await captureAgentCounts(client) : null
    await client.query(sql)
    const after = target.database === 'agent' ? await captureAgentCounts(client) : null
    if (before && after && (before.disponibilidades !== after.disponibilidades || before.slots !== after.slots)) {
      throw new Error('Migration de FK alterou contagens da agenda')
    }

    await client.query(
      `insert into public.succaozero_schema_migrations
        (version, sha256, database_kind, project_ref, metadata)
       values ($1, $2, $3, $4, $5::jsonb)`,
      [version, sha256, target.database, target.projectRef, JSON.stringify({ before, after })],
    )
    await client.query('commit')
    console.log('status=applied')
  } catch (error) {
    await client.query('rollback').catch(() => undefined)
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
