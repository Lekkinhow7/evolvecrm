import pg from 'pg'

import { buildAgentForeignKeyReport, resolveMigrationTarget } from './guards.mjs'

const { Client } = pg
const migrationVersion = '20260930080000_fix_schedule_foreign_keys.sql'

function flag(name) {
  const prefix = `--${name}=`
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length)
}

async function main() {
  const target = resolveMigrationTarget({
    database: 'agent',
    environment: flag('environment'),
    confirmProject: flag('confirm-project'),
  })
  const client = new Client({ connectionString: target.connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    const cross = await client.query(`
      select count(*)::integer as count
      from pg_constraint fk
      join pg_class child on child.oid = fk.conrelid
      join pg_class parent on parent.oid = fk.confrelid
      where fk.contype = 'f'
        and child.relname in ('succaozero_disponibilidade_semanal', 'succaozero_slots_horarios')
        and parent.relname like 'evolve\\_%' escape '\\'
    `)
    const integrity = await client.query(`
      select
        (select count(*)::integer
           from public.succaozero_disponibilidade_semanal d
           left join public.succaozero_profissionais p on p.id = d.profissional_id
          where p.id is null) as orphan_disponibilidades,
        (select count(*)::integer
           from public.succaozero_slots_horarios s
           left join public.succaozero_disponibilidade_semanal d on d.id = s.disponibilidade_id
          where d.id is null) as orphan_slots,
        (select count(*)::integer from public.succaozero_disponibilidade_semanal) as disponibilidades,
        (select count(*)::integer from public.succaozero_slots_horarios) as slots
    `)
    const ledger = await client.query(
      `select metadata from public.succaozero_schema_migrations where version = $1`,
      [migrationVersion],
    )
    if (!ledger.rowCount) throw new Error('Migration de FKs não registrada')
    const metadata = ledger.rows[0].metadata
    const row = integrity.rows[0]
    const report = buildAgentForeignKeyReport({
      crossSchemaForeignKeys: Number(cross.rows[0].count),
      orphanDisponibilidades: Number(row.orphan_disponibilidades),
      orphanSlots: Number(row.orphan_slots),
      beforeDisponibilidades: Number(metadata.before.disponibilidades),
      afterDisponibilidades: Number(row.disponibilidades),
      beforeSlots: Number(metadata.before.slots),
      afterSlots: Number(row.slots),
    })

    console.log(`cross_schema_foreign_keys=${report.crossSchemaForeignKeys}`)
    console.log(`orphan_disponibilidades=${report.orphanDisponibilidades}`)
    console.log(`orphan_slots=${report.orphanSlots}`)
    console.log(`count_mismatch=${report.countMismatch}`)
    if (!report.ok) process.exitCode = 1
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
