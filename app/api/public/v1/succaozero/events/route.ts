import { NextResponse } from 'next/server'
import { z } from 'zod'

import { authPublicApi } from '@/lib/public-api/auth'
import { moveStageByDealId } from '@/lib/public-api/dealsMoveStage'
import { getSuccaozeroConfig } from '@/lib/succaozero/config'
import {
  requestSuccaozeroNextAction,
  resolveSuccaozeroOpportunity,
} from '@/lib/succaozero/events'
import { ingestSuccaozeroLead } from '@/lib/succaozero/intake'
import { createStaticAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const EventSchema = z
  .object({
    event_id: z.string().min(1).max(200),
    event_type: z.enum([
      'lead.received',
      'lead.qualified',
      'stage.change_requested',
      'next_action.requested',
    ]),
    occurred_at: z.string().datetime({ offset: true }),
    subject: z
      .object({
        source_identifier: z.string().min(1).max(200),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        opportunity_id: z.string().uuid().optional(),
      })
      .strict(),
    payload: z.record(z.string(), z.unknown()).default({}),
  })
  .strict()

const LeadPayloadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  board_id: z.string().uuid(),
  stage_id: z.string().uuid(),
})

const StagePayloadSchema = z
  .object({
    to_stage_id: z.string().uuid().optional(),
    to_stage_label: z.string().trim().min(1).optional(),
    mark: z.enum(['won', 'lost']).optional(),
  })
  .refine((value) => value.to_stage_id || value.to_stage_label, {
    message: 'to_stage_id or to_stage_label is required',
  })

const NextActionPayloadSchema = z.object({
  kind: z.string().trim().min(1).max(100),
  due_at: z.string().datetime({ offset: true }),
  executor_profile_id: z.string().uuid().optional(),
})

function error(status: number, message: string, code: string) {
  return NextResponse.json({ error: message, code }, { status })
}

export async function POST(request: Request) {
  const auth = await authPublicApi(request)
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status })

  let config
  try {
    config = getSuccaozeroConfig()
  } catch {
    return error(503, 'Sucção Zero integration is unavailable', 'SERVICE_UNAVAILABLE')
  }
  if (!config.enabled) {
    return error(503, 'Sucção Zero integration is unavailable', 'SERVICE_UNAVAILABLE')
  }
  if (auth.organizationId !== config.organizationId) {
    return error(403, 'API key is outside the Sucção Zero organization', 'TENANT_MISMATCH')
  }

  const parsed = EventSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return error(422, 'Invalid event envelope', 'VALIDATION_ERROR')
  const event = parsed.data
  const supabase = createStaticAdminClient()

  if (event.event_type === 'lead.received') {
    const payload = LeadPayloadSchema.safeParse(event.payload)
    if (!payload.success) return error(422, 'Invalid lead payload', 'VALIDATION_ERROR')

    try {
      const result = await ingestSuccaozeroLead(
        {
          source: 'n8n',
          externalEventId: event.event_id,
          name: payload.data.name,
          phone: event.subject.phone,
          email: event.subject.email,
          alternateIdentifier: event.subject.source_identifier,
          boardId: payload.data.board_id,
          stageId: payload.data.stage_id,
          metadata: { ...event.payload, occurred_at: event.occurred_at },
        },
        { organizationId: config.organizationId, supabase },
      )
      const pending =
        result.status === 'pending_identity' || result.status === 'queued_without_owner'
      return NextResponse.json(result, {
        status: pending ? 202 : result.duplicate ? 200 : 201,
      })
    } catch (cause) {
      console.error('[succaozero-events] lead intake failed', cause)
      return error(500, 'Failed to process lead event', 'PROCESSING_ERROR')
    }
  }

  const opportunityId = event.subject.opportunity_id
  if (!opportunityId) {
    return error(422, 'opportunity_id is required for this event', 'VALIDATION_ERROR')
  }

  if (event.event_type === 'next_action.requested') {
    const payload = NextActionPayloadSchema.safeParse(event.payload)
    if (!payload.success) return error(422, 'Invalid next action payload', 'VALIDATION_ERROR')
    const result = await requestSuccaozeroNextAction({
      supabase,
      organizationId: config.organizationId,
      opportunityId,
      eventId: event.event_id,
      occurredAt: event.occurred_at,
      kind: payload.data.kind,
      dueAt: payload.data.due_at,
      executorProfileId: payload.data.executor_profile_id,
      actorId: auth.apiKeyId,
      evidence: event.payload,
    })
    return NextResponse.json(result.body, { status: result.status })
  }

  const target = StagePayloadSchema.safeParse(event.payload)
  if (!target.success) return error(422, 'Invalid stage payload', 'VALIDATION_ERROR')
  const opportunity = await resolveSuccaozeroOpportunity(
    supabase,
    config.organizationId,
    opportunityId,
  )
  if (!opportunity) return error(404, 'Opportunity not found', 'NOT_FOUND')

  const result = await moveStageByDealId({
    organizationId: config.organizationId,
    dealId: opportunity.crmDealId,
    target: {
      to_stage_id: target.data.to_stage_id,
      to_stage_label: target.data.to_stage_label,
    },
    mark: target.data.mark,
    eventId: event.event_id,
    eventOccurredAt: event.occurred_at,
    actorId: auth.apiKeyId,
  })
  return NextResponse.json(result.body, { status: result.status })
}
