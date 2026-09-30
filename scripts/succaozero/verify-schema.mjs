import pg from 'pg'

import { REQUIRED_CANONICAL_TABLES, buildSchemaReport, resolveMigrationTarget } from './guards.mjs'

const { Client } = pg

function flag(name) {
  const prefix = `--${name}=`
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length)
}

async function main() {
  const target = resolveMigrationTarget({
    database: 'crm',
    environment: flag('environment'),
    confirmProject: flag('confirm-project'),
  })
  const client = new Client({ connectionString: target.connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    const tables = await client.query(
      `select c.relname, c.relrowsecurity, c.relforcerowsecurity
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = any($1::text[])`,
      [REQUIRED_CANONICAL_TABLES],
    )
    const fks = await client.query(`
      select count(*)::integer as count
      from pg_constraint fk
      join pg_class child on child.oid = fk.conrelid
      join pg_class parent on parent.oid = fk.confrelid
      join pg_namespace child_ns on child_ns.oid = child.relnamespace
      join pg_namespace parent_ns on parent_ns.oid = parent.relnamespace
      where fk.contype = 'f'
        and child_ns.nspname = 'public'
        and parent_ns.nspname = 'public'
        and child.relname like 'succaozero\\_%' escape '\\'
        and parent.relname like 'evolve\\_%' escape '\\'
    `)
    const grants = await client.query(`
      select count(*)::integer as count
      from information_schema.table_privileges
      where table_schema = 'public'
        and table_name like 'succaozero\\_%' escape '\\'
        and grantee = 'anon'
    `)
    const report = buildSchemaReport({
      existingTables: tables.rows.map((row) => row.relname),
      rlsEnabledTables: tables.rows
        .filter((row) => row.relrowsecurity && row.relforcerowsecurity)
        .map((row) => row.relname),
      foreignKeysToEvolve: Number(fks.rows[0].count),
      anonBusinessGrants: Number(grants.rows[0].count),
    })

    console.log(`missing_tables=${report.missingTables.join(',')}`)
    console.log(`rls_missing=${report.rlsMissing.join(',')}`)
    console.log(`foreign_keys_to_evolve=${report.foreignKeysToEvolve}`)
    console.log(`anon_business_grants=${report.anonBusinessGrants}`)
    if (!report.ok) process.exitCode = 1
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
