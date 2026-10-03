import pg from 'pg'
const productionUrl = process.env.SUCCAOZERO_CRM_DATABASE_URL || ''
const restoreUrl = process.env.SUCCAOZERO_RESTORE_DATABASE_URL || ''
if (!productionUrl || !restoreUrl) throw new Error('URLs de produção e restauração são obrigatórias')
const ref = (url) => { try { return new URL(url).hostname.split('.')[1] || new URL(url).hostname.split('.')[0] } catch { return '' } }
if (ref(productionUrl) && ref(productionUrl) === ref(restoreUrl)) throw new Error('A restauração deve usar projeto diferente da produção')
const source = new pg.Pool({ connectionString: productionUrl, max: 1 }); const restore = new pg.Pool({ connectionString: restoreUrl, max: 1 })
const tables = ['succaozero_contacts','succaozero_opportunities','succaozero_next_actions','succaozero_commercial_events','succaozero_inbound_events','succaozero_seller_roster']
try {
  let schemaMismatch = 0, countMismatch = 0, sampleMismatch = 0
  for (const table of tables) {
    const [a,b] = await Promise.all([source.query(`select count(*)::bigint count from public.${table}`), restore.query(`select count(*)::bigint count from public.${table}`)])
    if (a.rows[0].count !== b.rows[0].count) countMismatch++
    const [sa,sb] = await Promise.all([source.query(`select column_name,data_type from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position`,[table]), restore.query(`select column_name,data_type from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position`,[table])])
    if (JSON.stringify(sa.rows) !== JSON.stringify(sb.rows)) schemaMismatch++
    if (!table.endsWith('_roster')) { const [ia,ib] = await Promise.all([source.query(`select id::text from public.${table} order by id limit 20`), restore.query(`select id::text from public.${table} order by id limit 20`)]); if (JSON.stringify(ia.rows) !== JSON.stringify(ib.rows)) sampleMismatch++ }
  }
  console.log(`schema_mismatch=${schemaMismatch}`); console.log(`count_mismatch=${countMismatch}`); console.log(`sample_id_mismatch=${sampleMismatch}`)
  if (schemaMismatch || countMismatch || sampleMismatch) process.exitCode = 1
} finally { await Promise.all([source.end(), restore.end()]) }
