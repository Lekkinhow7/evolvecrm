import { randomUUID } from 'node:crypto'

import pg from 'pg'

import { resolveMigrationTarget } from './guards.mjs'

const { Pool } = pg

function flag(name) {
  const prefix = `--${name}=`
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length)
}

function requiredEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Configuração de teste ausente: ${name}`)
  return value
}

async function assertSyntheticFixture(pool, fixture) {
  const { rows: [row] } = await pool.query(
    `select o.name,
            exists (select 1 from public.boards b where b.id = $2 and b.organization_id = o.id) as board_ok,
            exists (select 1 from public.board_stages s where s.id = $3 and s.board_id = $2 and s.organization_id = o.id) as stage_ok,
            (select count(*)::integer from public.profiles p where p.organization_id = o.id and p.id = any($4::uuid[])) as sellers
       from public.organizations o
      where o.id = $1`,
    [fixture.organizationId, fixture.boardId, fixture.stageId, [fixture.sellerA, fixture.sellerB]],
  )
  if (!row || !/(test|teste|sint[eé]tico)/i.test(row.name) || !row.board_ok || !row.stage_ok || row.sellers !== 2) {
    throw new Error('Fixture recusada: use uma organização sintética isolada em staging')
  }
}

async function ingest(pool, fixture, externalEventId, alternateIdentifier) {
  const payload = {
    organization_id: fixture.organizationId,
    source: 'manual',
    externalEventId,
    name: 'Contato sintético de concorrência',
    alternateIdentifier,
    boardId: fixture.boardId,
    stageId: fixture.stageId,
    metadata: { synthetic: true },
  }
  const { rows: [row] } = await pool.query(
    'select public.succaozero_ingest_lead($1::jsonb) as result',
    [JSON.stringify(payload)],
  )
  return row.result
}

async function captureRoutingState(pool, fixture) {
  const { rows: [row] } = await pool.query(
    `select
       coalesce((select jsonb_agg(jsonb_build_object(
         'profile_id', r.profile_id, 'position', r.position,
         'eligible', r.eligible, 'paused_until', r.paused_until
       ) order by r.position) from public.succaozero_seller_roster r
       where r.organization_id = $1), '[]'::jsonb) as roster,
       (select to_jsonb(s) from public.succaozero_routing_state s where s.organization_id = $1) as routing`,
    [fixture.organizationId],
  )
  return row
}

async function cleanup(pool, fixture, prefix, previous) {
  await pool.query('begin')
  try {
    const { rows } = await pool.query(
      `select e.id as event_id, e.contact_id, e.opportunity_id,
              c.crm_contact_id, o.crm_deal_id
         from public.succaozero_inbound_events e
         left join public.succaozero_contacts c on c.id = e.contact_id
         left join public.succaozero_opportunities o on o.id = e.opportunity_id
        where e.organization_id = $1 and e.source = 'manual' and e.external_event_id like $2`,
      [fixture.organizationId, `${prefix}%`],
    )
    const ids = (key) => [...new Set(rows.map((row) => row[key]).filter(Boolean))]
    await pool.query(
      `delete from public.succaozero_commercial_events
        where organization_id = $1 and event_key like $2`,
      [fixture.organizationId, `manual:${prefix}%`],
    )
    await pool.query('delete from public.succaozero_inbound_events where id = any($1::uuid[])', [ids('event_id')])
    await pool.query('delete from public.succaozero_opportunities where id = any($1::uuid[])', [ids('opportunity_id')])
    await pool.query('delete from public.deals where id = any($1::uuid[])', [ids('crm_deal_id')])
    await pool.query('delete from public.succaozero_contacts where id = any($1::uuid[])', [ids('contact_id')])
    await pool.query('delete from public.contacts where id = any($1::uuid[])', [ids('crm_contact_id')])
    if (previous) {
      await pool.query(
        `select public.succaozero_set_seller_roster(jsonb_build_object(
          'organization_id', $1::uuid, 'sellers', $2::jsonb
        ))`,
        [fixture.organizationId, JSON.stringify(previous.roster)],
      )
      if (previous.routing) {
        await pool.query(
          `update public.succaozero_routing_state
              set next_position = $2, version = $3, updated_at = $4
            where organization_id = $1`,
          [
            fixture.organizationId,
            previous.routing.next_position,
            previous.routing.version,
            previous.routing.updated_at,
          ],
        )
      } else {
        await pool.query(
          'delete from public.succaozero_routing_state where organization_id = $1',
          [fixture.organizationId],
        )
      }
    }
    await pool.query('commit')
  } catch (error) {
    await pool.query('rollback')
    throw error
  }
}

async function main() {
  const environment = flag('environment')
  if (environment !== 'staging') throw new Error('Teste de concorrência permitido somente em staging')
  const target = resolveMigrationTarget({ database: 'crm', environment })
  const fixture = {
    organizationId: requiredEnv('SUCCAOZERO_TEST_ORGANIZATION_ID'),
    boardId: requiredEnv('SUCCAOZERO_TEST_BOARD_ID'),
    stageId: requiredEnv('SUCCAOZERO_TEST_STAGE_ID'),
    sellerA: requiredEnv('SUCCAOZERO_TEST_SELLER_A_ID'),
    sellerB: requiredEnv('SUCCAOZERO_TEST_SELLER_B_ID'),
  }
  const pool = new Pool({
    connectionString: target.connectionString,
    ssl: { rejectUnauthorized: false },
    max: 22,
  })
  const run = `routing-test:${randomUUID()}:`
  let previous = null
  try {
    await assertSyntheticFixture(pool, fixture)
    previous = await captureRoutingState(pool, fixture)
    await pool.query(
      `select public.succaozero_set_seller_roster(jsonb_build_object(
        'organization_id', $1::uuid,
        'sellers', jsonb_build_array(
          jsonb_build_object('profile_id', $2::uuid, 'position', 0, 'eligible', true),
          jsonb_build_object('profile_id', $3::uuid, 'position', 1, 'eligible', true)
        )
      ))`,
      [fixture.organizationId, fixture.sellerA, fixture.sellerB],
    )

    const results = await Promise.all(Array.from({ length: 20 }, (_, index) => ingest(
      pool,
      fixture,
      `${run}${index}`,
      `${run}identity:${index}`,
    )))
    const duplicateId = `${run}duplicate`
    const duplicateResults = await Promise.all([
      ingest(pool, fixture, duplicateId, `${run}identity:duplicate`),
      ingest(pool, fixture, duplicateId, `${run}identity:duplicate`),
    ])
    const assignedA = results.filter((result) => result.ownerProfileId === fixture.sellerA).length
    const assignedB = results.filter((result) => result.ownerProfileId === fixture.sellerB).length
    const duplicateOpportunities = new Set(duplicateResults.map((result) => result.opportunityId)).size - 1
    const { rows: [eventCounts] } = await pool.query(
      `select count(*)::integer as events,
              count(distinct opportunity_id)::integer as opportunities
         from public.succaozero_inbound_events
        where organization_id = $1 and source = 'manual' and external_event_id like $2`,
      [fixture.organizationId, `${run}%`],
    )
    const duplicateEvents = Number(eventCounts.events) - 21

    console.log(`assigned_A=${assignedA}`)
    console.log(`assigned_B=${assignedB}`)
    console.log(`duplicate_opportunities=${duplicateOpportunities}`)
    console.log(`duplicate_events=${duplicateEvents}`)
    if (assignedA !== 10 || assignedB !== 10 || duplicateOpportunities !== 0 || duplicateEvents !== 0) {
      process.exitCode = 1
    }
  } finally {
    await cleanup(pool, fixture, run, previous).catch((error) => {
      console.error(`cleanup_failed=${error instanceof Error ? error.message : String(error)}`)
      process.exitCode = 1
    })
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
