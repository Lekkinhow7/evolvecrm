import { beforeEach, describe, expect, it, vi } from 'vitest'

const ORG_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5'

vi.mock('@/lib/public-api/auth', () => ({ authPublicApi: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createStaticAdminClient: vi.fn(() => ({})) }))
vi.mock('@/lib/agenda/reunioes', async (orig) => {
  const real = await orig<typeof import('@/lib/agenda/reunioes')>()
  return {
    ...real,
    registrarReuniao: vi.fn(async () => ({
      activityId: 'act-1',
      dealId: 'd-1',
      contactId: 'c-1',
      reused: false,
      warnings: [],
    })),
    cancelarReuniao: vi.fn(async () => 'act-1'),
  }
})

import { authPublicApi } from '@/lib/public-api/auth'
import { cancelarReuniao, registrarReuniao } from '@/lib/agenda/reunioes'
import { POST } from '@/app/api/public/v1/reunioes/route'

function req(body: unknown) {
  return new Request('http://localhost/api/public/v1/reunioes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/public/v1/reunioes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authPublicApi).mockResolvedValue({ ok: true, organizationId: ORG_ID } as any)
  })

  it('401 com chave inválida', async () => {
    vi.mocked(authPublicApi).mockResolvedValue({ ok: false, status: 401, body: { error: 'x' } } as any)
    const res = await POST(req({}))
    expect(res.status).toBe(401)
  })

  it('422 sem external_ref', async () => {
    const res = await POST(req({ phone: '71993042122', starts_at: '2026-10-20T14:00:00' }))
    expect(res.status).toBe(422)
  })

  it('422 cancelada sem external_ref', async () => {
    const res = await POST(req({ cancelada: true }))
    expect(res.status).toBe(422)
    expect(cancelarReuniao).not.toHaveBeenCalled()
  })

  it('cancelada com external_ref cancela', async () => {
    const res = await POST(req({ cancelada: true, external_ref: 'slot-1' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, cancelada: true, reuniao_id: 'act-1' })
  })

  it('201 e corpo de resposta ao registrar', async () => {
    const res = await POST(
      req({ phone: '71993042122', starts_at: '2026-10-20T14:00:00', external_ref: 'slot-1', format: 'online' }),
    )
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      ok: true,
      reuniao_id: 'act-1',
      deal_id: 'd-1',
      contact_id: 'c-1',
      reaproveitada: false,
      avisos: [],
    })
    expect(registrarReuniao).toHaveBeenCalledOnce()
  })
})
