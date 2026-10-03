import { beforeEach, describe, expect, it, vi } from 'vitest'

const ORG_ID = '11111111-1111-4111-8111-111111111111'
const ADMIN_ID = '22222222-2222-4222-8222-222222222222'
const SELLER_A = '33333333-3333-4333-8333-333333333333'
const SELLER_B = '44444444-4444-4444-8444-444444444444'

const mocks = vi.hoisted(() => ({
  allowedOrigin: vi.fn(),
  getUser: vi.fn(),
  profileSingle: vi.fn(),
  profilesIn: vi.fn(),
  rosterOrder: vi.fn(),
  stateSingle: vi.fn(),
  opportunitiesOrder: vi.fn(),
  rpc: vi.fn(),
}))

const profileQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: mocks.profileSingle,
  in: mocks.profilesIn,
}
const rosterQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: mocks.rosterOrder,
}
const stateQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: mocks.stateSingle,
}
const opportunityQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: mocks.opportunitiesOrder,
}
const supabase = {
  auth: { getUser: mocks.getUser },
  from: vi.fn((table: string) => {
    if (table === 'profiles') return profileQuery
    if (table === 'succaozero_seller_roster') return rosterQuery
    if (table === 'succaozero_routing_state') return stateQuery
    if (table === 'succaozero_opportunities') return opportunityQuery
    throw new Error(`Tabela inesperada: ${table}`)
  }),
  rpc: mocks.rpc,
}

vi.mock('@/lib/security/sameOrigin', () => ({
  isAllowedOrigin: mocks.allowedOrigin,
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => supabase,
}))

import { GET, PUT } from '@/app/api/admin/succaozero/sales-routing/route'

function put(body: unknown) {
  return new Request('http://localhost/api/admin/succaozero/sales-routing', {
    method: 'PUT',
    headers: { origin: 'http://localhost', host: 'localhost', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('administração do rodízio Sucção Zero', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.allowedOrigin.mockReturnValue(true)
    mocks.getUser.mockResolvedValue({ data: { user: { id: ADMIN_ID } } })
    mocks.profileSingle.mockResolvedValue({
      data: { id: ADMIN_ID, role: 'admin', organization_id: ORG_ID },
      error: null,
    })
    mocks.profilesIn.mockResolvedValue({
      data: [{ id: SELLER_A, email: 'maria@example.com' }, { id: SELLER_B, email: 'joao@example.com' }],
      error: null,
    })
    mocks.rosterOrder.mockResolvedValue({ data: [], error: null })
    mocks.stateSingle.mockResolvedValue({ data: { next_position: 0, version: 0 }, error: null })
    mocks.opportunitiesOrder.mockResolvedValue({ data: [], error: null })
    mocks.rpc.mockResolvedValue({ data: { sellers: [], nextProfileId: null, version: 0 }, error: null })
  })

  it('retorna 401 sem sessão', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } })

    const response = await GET()

    expect(response.status).toBe(401)
  })

  it('retorna 403 para vendedor', async () => {
    mocks.profileSingle.mockResolvedValue({
      data: { id: ADMIN_ID, role: 'vendedor', organization_id: ORG_ID },
      error: null,
    })

    const response = await PUT(put({ sellers: [] }))

    expect(response.status).toBe(403)
  })

  it('exige a mesma origem no PUT', async () => {
    mocks.allowedOrigin.mockReturnValue(false)

    const response = await PUT(put({ sellers: [] }))

    expect(response.status).toBe(403)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('rejeita posições duplicadas antes de chamar a RPC', async () => {
    const response = await PUT(put({
      sellers: [
        { profileId: SELLER_A, position: 0, eligible: true, pausedUntil: null },
        { profileId: SELLER_B, position: 0, eligible: true, pausedUntil: null },
      ],
    }))

    expect(response.status).toBe(422)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('rejeita perfil de outra organização', async () => {
    mocks.profilesIn.mockResolvedValue({ data: [{ id: SELLER_A }], error: null })

    const response = await PUT(put({
      sellers: [
        { profileId: SELLER_A, position: 0, eligible: true, pausedUntil: null },
        { profileId: SELLER_B, position: 1, eligible: true, pausedUntil: null },
      ],
    }))

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({ code: 'RELATIONSHIP_SCOPE_ERROR' })
  })

  it('aceita lista vazia com alerta explícito', async () => {
    const response = await PUT(put({ sellers: [] }))

    expect(response.status).toBe(200)
    expect(mocks.rpc).toHaveBeenCalledWith('succaozero_set_seller_roster', {
      p_payload: { organization_id: ORG_ID, sellers: [] },
    })
    await expect(response.json()).resolves.toMatchObject({
      warning: expect.stringMatching(/sem vendedor/i),
    })
  })
})
