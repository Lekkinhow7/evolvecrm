import { beforeEach, describe, expect, it, vi } from 'vitest'

const ORG = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5'

const state = {
  user: { id: 'u1' } as { id: string } | null,
  queues: {} as Record<string, unknown[]>,
  updates: [] as Array<{ table: string; row: any; eqs: Array<[string, unknown]> }>,
}

function fakeSb() {
  return {
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    from(table: string) {
      const eqs: Array<[string, unknown]> = []
      const b: any = {}
      for (const m of ['select', 'is']) b[m] = () => b
      b.eq = (c: string, v: unknown) => (eqs.push([c, v]), b)
      b.update = (row: any) => {
        state.updates.push({ table, row, eqs })
        return b
      }
      b.maybeSingle = async () => ({ data: state.queues[table]?.shift() ?? null, error: null })
      b.then = (res: any) => res({ data: null, error: null })
      return b
    },
  }
}

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(async () => fakeSb()) }))
vi.mock('@/lib/supabase/staticAdminClient', () => ({ createStaticAdminClient: vi.fn(() => ({ admin: true })) }))
vi.mock('@/lib/agenda/reunioes', () => ({
  registrarReuniao: vi.fn(async () => ({ activityId: 'act-1', dealId: 'd1', contactId: 'c1', reused: false, warnings: [] })),
  cancelarReuniao: vi.fn(async () => 'act-1'),
}))
vi.mock('@/lib/agenda/n8n', async () => {
  const real = await vi.importActual<typeof import('@/lib/agenda/n8n')>('@/lib/agenda/n8n')
  return { ...real, chamarAgendaNoN8n: vi.fn() }
})

import { AgendaN8nError, chamarAgendaNoN8n } from '@/lib/agenda/n8n'
import { cancelarReuniao, registrarReuniao } from '@/lib/agenda/reunioes'
import { GET as horarios } from '@/app/api/agenda/horarios-livres/route'
import { POST as criar } from '@/app/api/agenda/reunioes/route'
import { PATCH as alterar } from '@/app/api/agenda/reunioes/[id]/route'
import { POST as pedirDocs } from '@/app/api/agenda/pedir-documentos/route'

const n8n = vi.mocked(chamarAgendaNoN8n)
const json = (method: string, body?: unknown) =>
  new Request('http://x/api/agenda', {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  state.user = { id: 'u1' }
  state.updates = []
  state.queues = { profiles: [{ organization_id: ORG }, { organization_id: ORG }, { organization_id: ORG }] }
})

describe('GET /api/agenda/horarios-livres', () => {
  it('401 sem usuário', async () => {
    state.user = null
    const r = await horarios(new Request('http://x/api/agenda/horarios-livres'))
    expect(r.status).toBe(401)
    expect(n8n).not.toHaveBeenCalled()
  })
  it('repassa dias e devolve horários', async () => {
    n8n.mockResolvedValue({ horarios: [{ inicio: 'a', fim: 'b' }] })
    const r = await horarios(new Request('http://x/api/agenda/horarios-livres?dias=7'))
    expect(n8n).toHaveBeenCalledWith('horarios_livres', { dias: 7 })
    expect(await r.json()).toEqual({ horarios: [{ inicio: 'a', fim: 'b' }] })
  })
  it('502 com n8n fora', async () => {
    n8n.mockRejectedValue(new AgendaN8nError('x'))
    expect((await horarios(new Request('http://x/a'))).status).toBe(502)
  })
})

describe('POST /api/agenda/reunioes', () => {
  const corpo = { deal_id: 'd1', inicio: '2026-11-01T10:00:00-03:00', fim: '2026-11-01T11:00:00-03:00', formato: 'online' }
  it('401 sem usuário', async () => {
    state.user = null
    expect((await criar(json('POST', corpo))).status).toBe(401)
  })
  it('grava pelo registrarReuniao com externalRef do n8n e origem equipe', async () => {
    n8n.mockResolvedValue({ agendamento_id: 'ag-9', link: 'https://meet/x' })
    const r = await criar(json('POST', corpo))
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, reuniao_id: 'act-1' })
    expect(registrarReuniao).toHaveBeenCalledWith(
      { admin: true },
      expect.objectContaining({
        organizationId: ORG,
        dealId: 'd1',
        externalRef: 'ag-9',
        origem: 'equipe',
        format: 'online',
        meetingUrl: 'https://meet/x',
        startsAt: corpo.inicio,
        endsAt: corpo.fim,
      }),
    )
  })
  it('ocupado vira 409 HORARIO_OCUPADO', async () => {
    n8n.mockResolvedValue({ ocupado: true })
    const r = await criar(json('POST', corpo))
    expect(r.status).toBe(409)
    expect((await r.json()).code).toBe('HORARIO_OCUPADO')
    expect(registrarReuniao).not.toHaveBeenCalled()
  })
  it('n8n fora: 502 sem registrar', async () => {
    n8n.mockRejectedValue(new AgendaN8nError('Sem resposta do n8n'))
    const r = await criar(json('POST', corpo))
    expect(r.status).toBe(502)
    expect(registrarReuniao).not.toHaveBeenCalled()
  })
  it('400 com corpo incompleto', async () => {
    expect((await criar(json('POST', { deal_id: 'd1' }))).status).toBe(400)
    expect(n8n).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/agenda/reunioes/[id]', () => {
  beforeEach(() => {
    state.queues.activities = [{ external_ref: 'ag-1', deal_id: 'd1' }]
  })
  it('401 sem usuário', async () => {
    state.user = null
    expect((await alterar(json('PATCH', { acao: 'cancelar' }), ctx('a1'))).status).toBe(401)
  })
  it('404 se a reunião não é da organização', async () => {
    state.queues.activities = []
    const r = await alterar(json('PATCH', { acao: 'cancelar' }), ctx('a1'))
    expect(r.status).toBe(404)
    expect(n8n).not.toHaveBeenCalled()
  })
  it('cancelar manda agendamento_id e depois cancela no CRM', async () => {
    n8n.mockResolvedValue({ ok: true })
    const r = await alterar(json('PATCH', { acao: 'cancelar' }), ctx('a1'))
    expect(r.status).toBe(200)
    expect(n8n).toHaveBeenCalledWith('cancelar_reuniao', { agendamento_id: 'ag-1' })
    expect(cancelarReuniao).toHaveBeenCalledWith({ admin: true }, { organizationId: ORG, externalRef: 'ag-1' })
  })
  it('cancelar com n8n fora: 502 e nada gravado', async () => {
    n8n.mockRejectedValue(new AgendaN8nError('x'))
    const r = await alterar(json('PATCH', { acao: 'cancelar' }), ctx('a1'))
    expect(r.status).toBe(502)
    expect(cancelarReuniao).not.toHaveBeenCalled()
  })
  it('remarcar usa o mesmo externalRef e as novas datas', async () => {
    n8n.mockResolvedValue({ ok: true })
    const body = { acao: 'remarcar', inicio: '2026-11-02T10:00:00-03:00', fim: '2026-11-02T11:00:00-03:00' }
    const r = await alterar(json('PATCH', body), ctx('a1'))
    expect(r.status).toBe(200)
    expect(n8n).toHaveBeenCalledWith('remarcar_reuniao', { agendamento_id: 'ag-1', inicio: body.inicio, fim: body.fim })
    expect(registrarReuniao).toHaveBeenCalledWith(
      { admin: true },
      expect.objectContaining({ organizationId: ORG, dealId: 'd1', externalRef: 'ag-1', startsAt: body.inicio, endsAt: body.fim }),
    )
  })
  it('remarcar com horário ocupado: 409', async () => {
    n8n.mockResolvedValue({ ocupado: true })
    const body = { acao: 'remarcar', inicio: 'a', fim: 'b' }
    const r = await alterar(json('PATCH', body), ctx('a1'))
    expect(r.status).toBe(409)
    expect(registrarReuniao).not.toHaveBeenCalled()
  })
  it('status grava direto, filtrado por organização, sem n8n', async () => {
    const r = await alterar(json('PATCH', { acao: 'status', status: 'realizada' }), ctx('a1'))
    expect(r.status).toBe(200)
    expect(n8n).not.toHaveBeenCalled()
    const u = state.updates.find((x) => x.table === 'activities')!
    expect(u.row).toEqual({ meeting_status: 'realizada' })
    expect(u.eqs).toContainEqual(['organization_id', ORG])
    expect(u.eqs).toContainEqual(['id', 'a1'])
  })
  it('400 com ação inválida', async () => {
    expect((await alterar(json('PATCH', { acao: 'x' }), ctx('a1'))).status).toBe(400)
  })
})

describe('POST /api/agenda/pedir-documentos', () => {
  beforeEach(() => {
    state.queues.deals = [{ id: 'd1' }]
  })
  it('401 sem usuário', async () => {
    state.user = null
    expect((await pedirDocs(json('POST', { deal_id: 'd1' }))).status).toBe(401)
  })
  it('pede ao n8n e marca awaiting_documents', async () => {
    n8n.mockResolvedValue({ ok: true })
    const r = await pedirDocs(json('POST', { deal_id: 'd1' }))
    expect(r.status).toBe(200)
    expect(n8n).toHaveBeenCalledWith('pedir_documentos', { deal_id: 'd1' })
    const u = state.updates.find((x) => x.table === 'deals')!
    expect(u.row).toEqual({ awaiting_documents: true })
    expect(u.eqs).toContainEqual(['organization_id', ORG])
  })
  it('n8n fora: 502 e awaiting_documents não muda', async () => {
    n8n.mockRejectedValue(new AgendaN8nError('x'))
    const r = await pedirDocs(json('POST', { deal_id: 'd1' }))
    expect(r.status).toBe(502)
    expect(state.updates.find((x) => x.table === 'deals')).toBeUndefined()
  })
  it('404 se o negócio não é da organização', async () => {
    state.queues.deals = []
    expect((await pedirDocs(json('POST', { deal_id: 'd1' }))).status).toBe(404)
    expect(n8n).not.toHaveBeenCalled()
  })
})
