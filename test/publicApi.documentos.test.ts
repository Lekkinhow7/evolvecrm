import { beforeEach, describe, expect, it, vi } from 'vitest'

const ORG_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5'

vi.mock('@/lib/public-api/auth', () => ({ authPublicApi: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createStaticAdminClient: vi.fn(() => ({})) }))
vi.mock('@/lib/agenda/documentos', async (orig) => {
  const real = await orig<typeof import('@/lib/agenda/documentos')>()
  return {
    ...real,
    registrarDocumentos: vi.fn(async () => ({
      dealId: 'd-1',
      saved: 1,
      skipped: [{ fileName: 'v.mp4', reason: 'tipo_nao_aceito' }],
      taskId: 't-1',
      warnings: [],
    })),
  }
})

import { authPublicApi } from '@/lib/public-api/auth'
import { NegocioNaoEncontrado, registrarDocumentos } from '@/lib/agenda/documentos'
import { POST } from '@/app/api/public/v1/documentos/route'

const file = { url: 'https://x/a.pdf', file_name: 'a.pdf', mime_type: 'application/pdf' }

function req(body: unknown) {
  return new Request('http://localhost/api/public/v1/documentos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/public/v1/documentos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authPublicApi).mockResolvedValue({ ok: true, organizationId: ORG_ID } as any)
  })

  it('401 com chave inválida', async () => {
    vi.mocked(authPublicApi).mockResolvedValue({ ok: false, status: 401, body: { error: 'x' } } as any)
    expect((await POST(req({}))).status).toBe(401)
  })

  it('422 sem phone e sem deal_id', async () => {
    const res = await POST(req({ files: [file] }))
    expect(res.status).toBe(422)
    expect(registrarDocumentos).not.toHaveBeenCalled()
  })

  it('422 sem arquivos', async () => {
    expect((await POST(req({ phone: '71993042122', files: [] }))).status).toBe(422)
  })

  it('404 DEAL_NOT_FOUND sem negócio aberto', async () => {
    vi.mocked(registrarDocumentos).mockRejectedValueOnce(new NegocioNaoEncontrado())
    const res = await POST(req({ phone: '71993042122', files: [file] }))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Negócio não encontrado', code: 'DEAL_NOT_FOUND' })
  })

  it('200 e corpo de resposta', async () => {
    const res = await POST(req({ phone: '71993042122', note: 'oi', files: [{ ...file, external_ref: 'm-1' }] }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      ok: true,
      deal_id: 'd-1',
      salvos: 1,
      ignorados: [{ file_name: 'v.mp4', motivo: 'tipo_nao_aceito' }],
      tarefa_id: 't-1',
      avisos: [],
    })
    expect(registrarDocumentos).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        organizationId: ORG_ID,
        phone: '71993042122',
        note: 'oi',
        files: [{ url: file.url, fileName: 'a.pdf', mimeType: 'application/pdf', externalRef: 'm-1' }],
      }),
    )
  })
})
