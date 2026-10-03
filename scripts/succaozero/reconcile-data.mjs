import pg from 'pg'
const url = process.env.SUCCAOZERO_CRM_DATABASE_URL || ''
const organizationId = process.env.SUCCAOZERO_ORGANIZATION_ID || ''
if (!url || !organizationId) throw new Error('Configuração CRM Sucção Zero incompleta')
const db = new pg.Pool({ connectionString: url, max: 1 })
try {
  const { rows: [r] } = await db.query(`select
    (select count(*) from public.succaozero_opportunities o where o.organization_id=$1 and o.crm_deal_id is null) missing_projection,
    (select count(*) from public.deals d where d.organization_id=$1 and d.custom_fields ? 'succaozero_source' and not exists (select 1 from public.succaozero_opportunities o where o.crm_deal_id=d.id)) missing_canonical,
    (select count(*) from (select external_event_id from public.succaozero_inbound_events where organization_id=$1 group by external_event_id having count(*)>1) x) duplicate_events,
    (select count(*) from public.succaozero_opportunities o where o.organization_id=$1 and o.status='open' and not exists (select 1 from public.succaozero_next_actions a where a.opportunity_id=o.id and a.status in ('open','exception'))) open_without_next_action_or_exception,
    (select count(*) from public.succaozero_opportunities o where o.organization_id=$1 and o.owner_profile_id is not null and not exists (select 1 from public.succaozero_seller_roster s where s.organization_id=o.organization_id and s.profile_id=o.owner_profile_id)) owner_outside_roster`, [organizationId])
  let failed = false
  for (const [key, value] of Object.entries(r)) { console.log(`${key}=${value}`); if (Number(value) !== 0) failed = true }
  if (failed) process.exitCode = 1
} finally { await db.end() }
