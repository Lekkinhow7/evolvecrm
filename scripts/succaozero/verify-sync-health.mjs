import pg from 'pg'
const url = process.env.SUCCAOZERO_CRM_DATABASE_URL || ''
const organizationId = process.env.SUCCAOZERO_ORGANIZATION_ID || ''
if (!url || !organizationId) throw new Error('Configuração CRM Sucção Zero incompleta')
const db = new pg.Pool({ connectionString: url, max: 1 })
try {
  const { rows: [row] } = await db.query(`select
    max(processed_at) filter (where status in ('processed','pending_identity','queued_without_owner')) last_success_at,
    count(*) filter (where status='received' and received_at < now() - interval '5 minutes') stuck,
    count(*) filter (where status='failed') failed_without_retry
    from public.succaozero_inbound_events where organization_id=$1`, [organizationId])
  const lag = row.last_success_at ? Math.floor((Date.now() - new Date(row.last_success_at).getTime()) / 60000) : null
  console.log(`last_success_lag_minutes=${lag ?? 'unknown'}`)
  console.log(`stuck=${row.stuck}`)
  console.log(`failed_without_retry=${row.failed_without_retry}`)
  if (lag === null || lag > 10 || Number(row.stuck) > 0 || Number(row.failed_without_retry) > 0) process.exitCode = 1
} finally { await db.end() }
