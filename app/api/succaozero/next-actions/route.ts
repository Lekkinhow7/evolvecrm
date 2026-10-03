import { z } from 'zod'

import { isAllowedOrigin } from '@/lib/security/sameOrigin'
import { createClient } from '@/lib/supabase/server'

const FilterSchema = z.enum(['today', 'overdue', 'missing'])
const UpsertSchema = z.object({
  opportunityId: z.string().uuid(),
  executorProfileId: z.string().uuid(),
  kind: z.enum(['FIRST_CONTACT', 'FOLLOW_UP', 'PROPOSAL', 'REVIEW', 'OTHER']),
  dueAt: z.string().datetime({ offset: true }),
}).strict()
const CompleteSchema = z.object({
  actionId: z.string().uuid(),
  outcome: z.enum(['completed', 'exception']),
  reason: z.string().trim().min(1).max(500).optional(),
}).strict().refine((value) => value.outcome !== 'exception' || value.reason, {
  message: 'Exceção exige justificativa',
})

function json(body: unknown, status = 200) { return Response.json(body, { status }) }

async function session() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, response: json({ error: 'Unauthorized' }, 401) }
  const profile = await supabase.from('profiles').select('id,role,organization_id').eq('id', user.id).single()
  if (profile.error || !profile.data?.organization_id) return { ok: false as const, response: json({ error: 'Profile not found' }, 404) }
  return { ok: true as const, supabase, profile: profile.data }
}

function canManageAll(role: string) { return role === 'admin' || role === 'gestor' }

export async function GET(request: Request) {
  const auth = await session()
  if (!auth.ok) return auth.response
  const filter = FilterSchema.safeParse(new URL(request.url).searchParams.get('filter') || 'today')
  if (!filter.success) return json({ error: 'Invalid filter' }, 422)

  let opportunitiesQuery = auth.supabase
    .from('succaozero_opportunities')
    .select('id,crm_deal_id,title,owner_profile_id,stage_id,status,created_at')
    .eq('organization_id', auth.profile.organization_id)
    .eq('status', 'open')
  if (!canManageAll(auth.profile.role)) opportunitiesQuery = opportunitiesQuery.eq('owner_profile_id', auth.profile.id)
  const opportunities = await opportunitiesQuery
  if (opportunities.error) return json({ error: opportunities.error.message }, 500)

  const ids = (opportunities.data || []).map((item: any) => item.id)
  if (ids.length === 0) return json({ data: [] })
  const actions = await auth.supabase
    .from('succaozero_next_actions')
    .select('id,opportunity_id,executor_profile_id,kind,due_at,status,exception_reason,created_at')
    .eq('organization_id', auth.profile.organization_id)
    .in('opportunity_id', ids)
    .in('status', ['open', 'exception'])
  if (actions.error) return json({ error: actions.error.message }, 500)

  const opportunityById = new Map((opportunities.data || []).map((item: any) => [item.id, item]))
  const openByOpportunity = new Map((actions.data || []).filter((item: any) => item.status === 'open').map((item: any) => [item.opportunity_id, item]))
  const now = new Date()
  const saoPauloDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const data = filter.data === 'missing'
    ? (opportunities.data || []).filter((item: any) => !openByOpportunity.has(item.id)).map((item: any) => ({ opportunity: item, action: null }))
    : (actions.data || []).filter((action: any) => {
        if (action.status !== 'open' || !action.due_at) return false
        const dueDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(action.due_at))
        return filter.data === 'today' ? dueDate === saoPauloDate : new Date(action.due_at) < now && dueDate !== saoPauloDate
      }).map((action: any) => ({ opportunity: opportunityById.get(action.opportunity_id), action }))
  return json({ data })
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) return json({ error: 'Forbidden' }, 403)
  const auth = await session()
  if (!auth.ok) return auth.response
  const parsed = UpsertSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return json({ error: 'Invalid payload' }, 422)
  const opportunity = await auth.supabase.from('succaozero_opportunities').select('id,owner_profile_id').eq('organization_id', auth.profile.organization_id).eq('id', parsed.data.opportunityId).maybeSingle()
  if (opportunity.error) return json({ error: opportunity.error.message }, 500)
  if (!opportunity.data) return json({ error: 'Opportunity not found' }, 404)
  if (!canManageAll(auth.profile.role) && opportunity.data.owner_profile_id !== auth.profile.id) return json({ error: 'Forbidden' }, 403)
  const executor = await auth.supabase.from('profiles').select('id').eq('organization_id', auth.profile.organization_id).eq('id', parsed.data.executorProfileId).maybeSingle()
  if (executor.error) return json({ error: executor.error.message }, 500)
  if (!executor.data) return json({ error: 'Executor outside organization', code: 'RELATIONSHIP_SCOPE_ERROR' }, 422)

  await auth.supabase.from('succaozero_next_actions').update({ status: 'cancelled', completed_at: new Date().toISOString() }).eq('organization_id', auth.profile.organization_id).eq('opportunity_id', parsed.data.opportunityId).eq('status', 'open')
  const created = await auth.supabase.from('succaozero_next_actions').insert({ organization_id: auth.profile.organization_id, opportunity_id: parsed.data.opportunityId, executor_profile_id: parsed.data.executorProfileId, kind: parsed.data.kind, due_at: parsed.data.dueAt, status: 'open' }).select('id,opportunity_id,executor_profile_id,kind,due_at,status').single()
  if (created.error) return json({ error: created.error.message }, 500)
  await auth.supabase.from('succaozero_commercial_events').insert({ organization_id: auth.profile.organization_id, opportunity_id: parsed.data.opportunityId, event_key: `next-action:create:${created.data.id}`, event_type: 'next_action.created', actor_type: 'user', actor_id: auth.profile.id, new_value: created.data, evidence: {} })
  return json({ data: created.data }, 201)
}

export async function PATCH(request: Request) {
  if (!isAllowedOrigin(request)) return json({ error: 'Forbidden' }, 403)
  const auth = await session()
  if (!auth.ok) return auth.response
  const parsed = CompleteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return json({ error: 'Invalid payload' }, 422)
  const action = await auth.supabase.from('succaozero_next_actions').select('id,opportunity_id,executor_profile_id,status').eq('organization_id', auth.profile.organization_id).eq('id', parsed.data.actionId).maybeSingle()
  if (action.error) return json({ error: action.error.message }, 500)
  if (!action.data) return json({ error: 'Action not found' }, 404)
  if (!canManageAll(auth.profile.role) && action.data.executor_profile_id !== auth.profile.id) return json({ error: 'Forbidden' }, 403)
  const update = parsed.data.outcome === 'completed' ? { status: 'completed', completed_at: new Date().toISOString(), exception_reason: null } : { status: 'exception', completed_at: new Date().toISOString(), exception_reason: parsed.data.reason }
  const updated = await auth.supabase.from('succaozero_next_actions').update(update).eq('organization_id', auth.profile.organization_id).eq('id', parsed.data.actionId).select('id,opportunity_id,status,completed_at,exception_reason').single()
  if (updated.error) return json({ error: updated.error.message }, 500)
  await auth.supabase.from('succaozero_commercial_events').insert({ organization_id: auth.profile.organization_id, opportunity_id: action.data.opportunity_id, event_key: `next-action:${parsed.data.outcome}:${parsed.data.actionId}`, event_type: `next_action.${parsed.data.outcome}`, actor_type: 'user', actor_id: auth.profile.id, new_value: updated.data, evidence: parsed.data.reason ? { reason: parsed.data.reason } : {} })
  return json({ data: updated.data })
}
