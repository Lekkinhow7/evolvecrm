import { beforeEach, describe, expect, it, vi } from 'vitest'

const ORIGIN = 'https://succaozero.com.br'
const ORGANIZATION_ID = '11111111-1111-4111-8111-111111111111'
const BOARD_ID = '22222222-2222-4222-8222-222222222222'
const STAGE_ID = '33333333-3333-4333-8333-333333333333'
const EVENT_ID = '44444444-4444-4444-8444-444444444444'
const CONTACT_ID = '55555555-5555-4555-8555-555555555555'
const OPPORTUNITY_ID = '66666666-6666-4666-8666-666666666666'
const CRM_CONTACT_ID = '77777777-7777-4777-8777-777777777777'
const CRM_DEAL_ID = '88888888-8888-4888-8888-888888888888'
const OWNER_ID = '99999999-9999-4999-8999-999999999999'

const mocks = vi.hoisted(() => {
  function query(data: unknown) {
    const value = {
      select: vi.fn(),
      eq: vi.fn(),
      is: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    }
    value.select.mockReturnValue(value)
    value.eq.mockReturnValue(value)
    value.is.mockReturnValue(value)
    value.order.mockReturnValue(value)
    value.limit.mockReturnValue(value)
    return value
  }

  return {
    config: {
      enabled: true,
      organizationId: '11111111-1111-4111-8111-111111111111',
      boardKey: 'succaozero',
      projectRef: 'dcjyoxbchwomltpsgviu',
    },
    boardQuery: query({
      id: '22222222-2222-4222-8222-222222222222',
      organization_id: '11111111-1111-4111-8111-111111111111',
    }),
    stageQuery: query({ id: '33333333-3333-4333-8333-333333333333' }),
    from: vi.fn(),
    ingest: vi.fn(),
  }
})

vi.mock('@/lib/succaozero/config', () => ({
  getSuccaozeroConfig: () => mocks.config,
}))

vi.mock('@/lib/supabase/server', () => ({
  createStaticAdminClient: () => ({ from: mocks.from }),
}))

vi.mock('@/lib/succaozero/intake', () => ({
  ingestSuccaozeroLead: mocks.ingest,
}))

import { POST } from '@/app/api/site-lead/route'

function intakeResult(overrides: Record<string, unknown> = {}) {
  return {
    eventId: EVENT_ID,
    contactId: CONTACT_ID,
    opportunityId: OPPORTUNITY_ID,
    crmContactId: CRM_CONTACT_ID,
    crmDealId: CRM_DEAL_ID,
    ownerProfileId: OWNER_ID,
    duplicate: false,
    status: 'processed',
    ...overrides,
  }
}

function request(
  body: unknown = { name: 'Maria', phone: '(11) 99999-0000' },
  headers: Record<string, string> = {},
) {
  const headerValues = new Map(
    Object.entries({
      origin: ORIGIN,
      'content-type': 'application/json',
      ...headers,
    }).map(([name, value]) => [name.toLowerCase(), value]),
  )
  const value = new Request('https://crm.example.com/api/site-lead', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  Object.defineProperty(value, 'headers', {
    value: { get: (name: string) => headerValues.get(name.toLowerCase()) ?? null },
  })
  return value
}

describe('POST /api/site-lead', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('SITE_LEAD_ALLOWED_ORIGINS', ORIGIN)
    mocks.config.enabled = true
    mocks.from.mockImplementation((table: string) => {
      if (table === 'boards') return mocks.boardQuery
      if (table === 'board_stages') return mocks.stageQuery
      throw new Error(`Tabela inesperada: ${table}`)
    })
    mocks.ingest.mockResolvedValue(intakeResult())
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('resolve funil e etapa somente dentro da organização configurada', async () => {
    const siteRequest = request(undefined, { 'idempotency-key': 'site-001' })
    expect(process.env.SITE_LEAD_ALLOWED_ORIGINS).toBe(ORIGIN)
    expect(siteRequest.headers.get('origin')).toBe(ORIGIN)
    const response = await POST(siteRequest)

    expect(response.status).toBe(201)
    expect(mocks.boardQuery.eq).toHaveBeenCalledWith('organization_id', ORGANIZATION_ID)
    expect(mocks.stageQuery.eq).toHaveBeenCalledWith('organization_id', ORGANIZATION_ID)
    expect(mocks.ingest).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'site',
        externalEventId: 'site-001',
        boardId: BOARD_ID,
        stageId: STAGE_ID,
      }),
      expect.objectContaining({ organizationId: ORGANIZATION_ID }),
    )
  })

  it('mantém a mesma oportunidade ao repetir a chave de idempotência', async () => {
    mocks.ingest
      .mockResolvedValueOnce(intakeResult())
      .mockResolvedValueOnce(intakeResult({ duplicate: true }))

    const first = await POST(request(undefined, { 'idempotency-key': 'site-002' }))
    const second = await POST(request(undefined, { 'idempotency-key': 'site-002' }))
    const firstBody = await first.json()
    const secondBody = await second.json()

    expect(firstBody.opportunity_id).toBe(OPPORTUNITY_ID)
    expect(secondBody.opportunity_id).toBe(OPPORTUNITY_ID)
    expect(secondBody.duplicate).toBe(true)
    expect(mocks.ingest).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ externalEventId: 'site-002' }),
      expect.anything(),
    )
  })

  it('bloqueia origem não autorizada sem consultar o banco', async () => {
    const response = await POST(request(undefined, { origin: 'https://malicioso.example' }))

    expect(response.status).toBe(403)
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('ignora honeypot preenchido sem gravar', async () => {
    const response = await POST(request({ phone: '(11) 99999-0000', website: 'robô' }))

    expect(response.status).toBe(200)
    expect(mocks.ingest).not.toHaveBeenCalled()
  })

  it('rejeita JSON e telefone inválidos', async () => {
    const invalidJson = await POST(request('{'))
    const invalidPhone = await POST(request({ phone: 'inválido' }))

    expect(invalidJson.status).toBe(400)
    expect(invalidPhone.status).toBe(422)
    expect(mocks.ingest).not.toHaveBeenCalled()
  })

  it('retorna indisponível quando a entrada canônica está desligada', async () => {
    mocks.config.enabled = false

    const response = await POST(request())

    expect(response.status).toBe(503)
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('não faz escritas parciais quando o serviço falha', async () => {
    mocks.ingest.mockRejectedValue(new Error('falha transacional'))

    const response = await POST(request())

    expect(response.status).toBe(500)
    expect(mocks.from).toHaveBeenCalledTimes(2)
    expect(mocks.from).not.toHaveBeenCalledWith('contacts')
    expect(mocks.from).not.toHaveBeenCalledWith('deals')
    expect(mocks.from).not.toHaveBeenCalledWith('activities')
  })

  it('retorna 202 quando o lead exige atenção operacional', async () => {
    mocks.ingest.mockResolvedValue(
      intakeResult({
        opportunityId: null,
        crmContactId: null,
        crmDealId: null,
        ownerProfileId: null,
        status: 'pending_identity',
      }),
    )

    const response = await POST(request())

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      event_id: EVENT_ID,
      status: 'pending_identity',
    })
  })
})
