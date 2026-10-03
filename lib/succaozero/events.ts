import type { SupabaseClient } from '@supabase/supabase-js'

export interface SuccaozeroOpportunityReference {
  opportunityId: string
  crmDealId: string
}

export async function resolveSuccaozeroOpportunity(
  supabase: SupabaseClient,
  organizationId: string,
  opportunityId: string,
): Promise<SuccaozeroOpportunityReference | null> {
  const { data, error } = await supabase
    .from('succaozero_opportunities')
    .select('id,crm_deal_id')
    .eq('organization_id', organizationId)
    .eq('id', opportunityId)
    .maybeSingle()

  if (error) throw error
  if (!data?.id || !data.crm_deal_id) return null
  return { opportunityId: data.id as string, crmDealId: data.crm_deal_id as string }
}

export interface SuccaozeroNextActionRequest {
  supabase: SupabaseClient
  organizationId: string
  opportunityId: string
  eventId: string
  occurredAt: string
  kind: string
  dueAt: string
  executorProfileId?: string | null
  actorId?: string | null
  evidence?: Record<string, unknown>
}

export async function requestSuccaozeroNextAction(
  input: SuccaozeroNextActionRequest,
) {
  const existingEvent = await input.supabase
    .from('succaozero_commercial_events')
    .select('id')
    .eq('organization_id', input.organizationId)
    .eq('event_key', input.eventId)
    .maybeSingle()
  if (existingEvent.error) {
    return { ok: false as const, status: 500, body: { code: 'DB_ERROR', error: existingEvent.error.message } }
  }
  if (existingEvent.data) {
    return { ok: true as const, status: 200, body: { action: 'duplicate', duplicate: true } }
  }

  const opportunity = await input.supabase
    .from('succaozero_opportunities')
    .select('id,owner_profile_id')
    .eq('organization_id', input.organizationId)
    .eq('id', input.opportunityId)
    .maybeSingle()
  if (opportunity.error) {
    return { ok: false as const, status: 500, body: { code: 'DB_ERROR', error: opportunity.error.message } }
  }
  if (!opportunity.data) {
    return { ok: false as const, status: 404, body: { code: 'NOT_FOUND', error: 'Opportunity not found' } }
  }

  const executorProfileId =
    input.executorProfileId || (opportunity.data.owner_profile_id as string | null)
  if (!executorProfileId) {
    return {
      ok: false as const,
      status: 422,
      body: { code: 'VALIDATION_ERROR', error: 'Next action requires an executor' },
    }
  }

  const profile = await input.supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', input.organizationId)
    .eq('id', executorProfileId)
    .maybeSingle()
  if (profile.error) {
    return { ok: false as const, status: 500, body: { code: 'DB_ERROR', error: profile.error.message } }
  }
  if (!profile.data) {
    return {
      ok: false as const,
      status: 422,
      body: { code: 'RELATIONSHIP_SCOPE_ERROR', error: 'Executor is outside the organization' },
    }
  }

  const openAction = await input.supabase
    .from('succaozero_next_actions')
    .select('id')
    .eq('organization_id', input.organizationId)
    .eq('opportunity_id', input.opportunityId)
    .eq('status', 'open')
    .maybeSingle()
  if (openAction.error) {
    return { ok: false as const, status: 500, body: { code: 'DB_ERROR', error: openAction.error.message } }
  }
  if (openAction.data) {
    return {
      ok: false as const,
      status: 409,
      body: { code: 'NEXT_ACTION_EXISTS', error: 'Opportunity already has an open next action' },
    }
  }

  const action = await input.supabase
    .from('succaozero_next_actions')
    .insert({
      organization_id: input.organizationId,
      opportunity_id: input.opportunityId,
      executor_profile_id: executorProfileId,
      kind: input.kind,
      due_at: input.dueAt,
      status: 'open',
    })
    .select('id,opportunity_id,executor_profile_id,kind,due_at,status')
    .single()
  if (action.error) {
    return { ok: false as const, status: 500, body: { code: 'DB_ERROR', error: action.error.message } }
  }

  const event = await input.supabase.from('succaozero_commercial_events').insert({
    organization_id: input.organizationId,
    opportunity_id: input.opportunityId,
    event_key: input.eventId,
    event_type: 'next_action.requested',
    actor_type: 'integration',
    actor_id: input.actorId || null,
    previous_value: null,
    new_value: { next_action_id: action.data.id },
    evidence: input.evidence || {},
    occurred_at: input.occurredAt,
  })
  if (event.error) {
    return { ok: false as const, status: 500, body: { code: 'DB_ERROR', error: event.error.message } }
  }

  return { ok: true as const, status: 201, body: { action: 'created', data: action.data } }
}
