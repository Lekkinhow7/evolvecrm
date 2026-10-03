import { beforeEach, describe, expect, it, vi } from 'vitest'

const ORGANIZATION_ID = '11111111-1111-4111-8111-111111111111'
const OPPORTUNITY_ID = '22222222-2222-4222-8222-222222222222'
const DEAL_ID = '33333333-3333-4333-8333-333333333333'
const BOARD_ID = '44444444-4444-4444-8444-444444444444'
const STAGE_ID = '55555555-5555-4555-8555-555555555555'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  ingest: vi.fn(),
  moveStage: vi.fn(),
  resolveOpportunity: vi.fn(),
  requestNextAction: vi.fn(),
  config: {
    enabled: true,
    organizationId: '11111111-1111-4111-8111-111111111111',
    boardKey: 'succaozero',
    projectRef: 'dcjyoxbchwomltpsgviu',
  },
  supabase: {},
}))

vi.mock('@/lib/public-api/auth', () => ({ authPublicApi: mocks.auth }))
vi.mock('@/lib/public-api/dealsMoveStage', () => ({
  moveStageByDealId: mocks.moveStage,
}))
vi.mock('@/lib/succaozero/config', () => ({
  getSuccaozeroConfig: () => mocks.config,
}))
vi.mock('@/lib/succaozero/intake', () => ({
  ingestSuccaozeroLead: mocks.ingest,
}))
vi.mock('@/lib/succaozero/events', () => ({
  resolveSuccaozeroOpportunity: mocks.resolveOpportunity,
  requestSuccaozeroNextAction: mocks.requestNextAction,
}))
vi.mock('@/lib/supabase/server', () => ({
  createStaticAdminClient: () => mocks.supabase,
}))

import { POST } from '@/app/api/public/v1/succaozero/events/route'

function request(body: unknown, withKey = true) {
  return new Request('http://localhost/api/public/v1/succaozero/events', {
    method: 'POST',
    headers: withKey ? { 'x-api-key': 'test-key', 'content-type': 'application/json' } : {},
    body: JSON.stringify(body),
  })
}

function envelope(overrides: Record<string, unknown> = {}) {
  return {
    event_id: 'wa:message:001',
    event_type: 'lead.received',
    occurred_at: '2026-09-30T12:00:00-03:00',
    subject: {
      source_identifier: '5511999990000@lid',
    },
    payload: {
      name: 'Maria',
      board_id: BOARD_ID,
      stage_id: STAGE_ID,
    },
    ...overrides,
  }
}

describe('POST /api/public/v1/succaozero/events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.config.enabled = true
    mocks.config.organizationId = ORGANIZATION_ID
    mocks.auth.mockResolvedValue({
      ok: true,
      organizationId: ORGANIZATION_ID,
      organizationName: 'Sucção Zero',
      apiKeyId: 'key-1',
      apiKeyPrefix: 'sz_',
    })
    mocks.ingest.mockResolvedValue({
      eventId: '66666666-6666-4666-8666-666666666666',
      contactId: '77777777-7777-4777-8777-777777777777',
      opportunityId: null,
      crmContactId: null,
      crmDealId: null,
      ownerProfileId: null,
      duplicate: false,
      status: 'pending_identity',
    })
    mocks.resolveOpportunity.mockResolvedValue({
      opportunityId: OPPORTUNITY_ID,
      crmDealId: DEAL_ID,
    })
    mocks.moveStage.mockResolvedValue({
      ok: true,
      status: 200,
      body: { data: { id: DEAL_ID, stage_id: STAGE_ID }, action: 'moved' },
    })
    mocks.requestNextAction.mockResolvedValue({
      ok: true,
      status: 201,
      body: { action: 'created' },
    })
  })

  it('propaga autenticação ausente ou inválida', async () => {
    mocks.auth.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Missing X-Api-Key', code: 'AUTH_MISSING' },
    })

    const response = await POST(request(envelope(), false))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ code: 'AUTH_MISSING' })
  })

  it('impede uma API key de outra organização', async () => {
    mocks.auth.mockResolvedValue({
      ok: true,
      organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      organizationName: 'Outra empresa',
      apiKeyId: 'key-2',
      apiKeyPrefix: 'other_',
    })

    const response = await POST(request(envelope()))

    expect(response.status).toBe(403)
    expect(mocks.ingest).not.toHaveBeenCalled()
  })

  it('mantém @lid sem telefone como pendência explícita', async () => {
    const response = await POST(request(envelope()))

    expect(response.status).toBe(202)
    expect(mocks.ingest).toHaveBeenCalledWith(
      expect.objectContaining({
        externalEventId: 'wa:message:001',
        alternateIdentifier: '5511999990000@lid',
        phone: undefined,
      }),
      expect.objectContaining({ organizationId: ORGANIZATION_ID }),
    )
    await expect(response.json()).resolves.toMatchObject({ status: 'pending_identity' })
  })

  it('devolve duplicidade do evento sem criar outra oportunidade', async () => {
    mocks.ingest.mockResolvedValue({
      eventId: '66666666-6666-4666-8666-666666666666',
      contactId: '77777777-7777-4777-8777-777777777777',
      opportunityId: OPPORTUNITY_ID,
      crmContactId: '88888888-8888-4888-8888-888888888888',
      crmDealId: DEAL_ID,
      ownerProfileId: null,
      duplicate: true,
      status: 'processed',
    })

    const response = await POST(request(envelope()))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ duplicate: true })
  })

  it('repassa etapa ambígua e evento fora de ordem sem mascarar o erro', async () => {
    mocks.moveStage
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        body: { code: 'VALIDATION_ERROR', error: 'Ambiguous stage label for this board' },
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        body: { code: 'OUT_OF_ORDER', error: 'Event is older than current state' },
      })
    const event = envelope({
      event_type: 'stage.change_requested',
      subject: { source_identifier: 'wa:message:002', opportunity_id: OPPORTUNITY_ID },
      payload: { to_stage_label: 'Qualificado' },
    })

    const ambiguous = await POST(request(event))
    const outOfOrder = await POST(request({ ...event, event_id: 'wa:message:003' }))

    expect(ambiguous.status).toBe(422)
    expect(outOfOrder.status).toBe(409)
  })

  it('encaminha solicitação de próxima ação ao serviço canônico', async () => {
    const response = await POST(
      request(
        envelope({
          event_type: 'next_action.requested',
          subject: { source_identifier: 'wa:message:004', opportunity_id: OPPORTUNITY_ID },
          payload: {
            kind: 'FOLLOW_UP',
            due_at: '2026-10-01T12:00:00-03:00',
          },
        }),
      ),
    )

    expect(response.status).toBe(201)
    expect(mocks.requestNextAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'wa:message:001',
        organizationId: ORGANIZATION_ID,
        opportunityId: OPPORTUNITY_ID,
      }),
    )
  })

  it('retorna indisponibilidade quando a integração está desligada', async () => {
    mocks.config.enabled = false

    const response = await POST(request(envelope()))

    expect(response.status).toBe(503)
  })
})
