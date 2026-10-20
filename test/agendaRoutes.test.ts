import { beforeEach, describe, expect, it, vi } from 'vitest'

const ORG = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5'

const state = {
  user: { id: 'u1' } as { id: string } | null,
  queues: {} as Record<string, unknown[]>,
  updates: [] as Array<{ table: string; row: any; eqs: Array<[string, unknown]> }>,
  selects: [] as Array<{ table: string; eqs: Array<[string, unknown]> }>,
  updateError: null as unknown,
}

function fakeSb() {
  return {
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    from(table: string) {
      const eqs: Array<[string, unknown]> = []
      state.selects.push({ table, eqs })
      const b: any = {}
      for (const m of ['select', 'is']) b[m] = () => b
      b.eq = (c: string, v: unknown) => (eqs.push([c, v]), b)
      b.update = (row: any) => {
        state.updates.push({ table, row, eqs })
        return b
      }
      b.maybeSingle = async () => ({ data: state.queues[table]?.shift() ?? null, error: null })
      b.then = (res: any) => res({ data: null, error: state.updateError })
      return b
    },
  }
}

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(async () => fakeSb()) }))
vi.mock('@/lib/supabase/staticAdminClient', () => ({ createStaticAdminClient: vi.fn(() => ({ admin: true })) }))
vi.mock('@/lib/agenda/reunioes', async () => ({
  ...(await vi.importActual<typeof import('@/lib/agenda/reunioes')>('@/lib/agenda/reunioes')),
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
  state.selects = []
  state.updateError = null
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
  beforeEach(() => {
    state.queues.deals = [{ id: 'd1' }]
  })
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
  it('400 com datas inválidas ou fim antes do início', async () => {
    expect((await criar(json('POST', { ...corpo, inicio: 'a', fim: 'b' }))).status).toBe(400)
    expect((await criar(json('POST', { ...corpo, inicio: corpo.fim, fim: corpo.inicio }))).status).toBe(400)
    expect(n8n).not.toHaveBeenCalled()
  })
  it('negócio de outra organização: 404 sem n8n nem registro', async () => {
    state.queues.deals = []
    const r = await criar(json('POST', corpo))
    expect(r.status).toBe(404)
    expect(n8n).not.toHaveBeenCalled()
    expect(registrarReuniao).not.toHaveBeenCalled()
    const s = state.selects.find((x) => x.table === 'deals')!
    expect(s.eqs).toContainEqual(['organization_id', ORG])
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
    const s = state.selects.find((x) => x.table === 'activities')!
    expect(s.eqs).toContainEqual(['organization_id', ORG])
    expect(s.eqs).toContainEqual(['type', 'MEETING'])
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
    const body = { acao: 'remarcar', inicio: '2026-11-02T10:00:00-03:00', fim: '2026-11-02T11:00:00-03:00' }
    const r = await alterar(json('PATCH', body), ctx('a1'))
    expect(r.status).toBe(409)
    expect(registrarReuniao).not.toHaveBeenCalled()
  })
  it('remarcar com datas inválidas ou fim antes do início: 400', async () => {
    const a = { acao: 'remarcar', inicio: 'a', fim: 'b' }
    const b = { acao: 'remarcar', inicio: '2026-11-02T11:00:00-03:00', fim: '2026-11-02T10:00:00-03:00' }
    expect((await alterar(json('PATCH', a), ctx('a1'))).status).toBe(400)
    expect((await alterar(json('PATCH', b), ctx('a1'))).status).toBe(400)
    expect(n8n).not.toHaveBeenCalled()
  })
  it('status com erro de gravação: 500 FALHA_AO_GRAVAR', async () => {
    state.updateError = { message: 'boom' }
    const r = await alterar(json('PATCH', { acao: 'status', status: 'realizada' }), ctx('a1'))
    expect(r.status).toBe(500)
    expect((await r.json()).code).toBe('FALHA_AO_GRAVAR')
  })
  it('status grava direto, filtrado por organização, sem n8n', async () => {
    const r = await alterar(json('PATCH', { acao: 'status', status: 'realizada' }), ctx('a1'))
    expect(r.status).toBe(200)
    expect(n8n).not.toHaveBeenCalled()
    const u = state.updates.find((x) => x.table === 'activities')!
    expect(u.row).toEqual({ meeting_status: 'realizada', completed: true })
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
    expect(n8n).toHaveBeenCalledWith('pedir_documentos', { deal_id: 'd1', contact_id: null, phone: null, name: null })
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
    const s = state.selects.find((x) => x.table === 'deals')!
    expect(s.eqs).toContainEqual(['organization_id', ORG])
  })
  it('erro ao gravar awaiting_documents: 500 FALHA_AO_GRAVAR', async () => {
    n8n.mockResolvedValue({ ok: true })
    state.updateError = { message: 'boom' }
    const r = await pedirDocs(json('POST', { deal_id: 'd1' }))
    expect(r.status).toBe(500)
    expect((await r.json()).code).toBe('FALHA_AO_GRAVAR')
  })
})

describe('revisão final: rotas internas', () => {
  const PEDIDO = '0b6f1c1e-6a7d-4c5e-9f0a-1b2c3d4e5f60'
  const corpo = { deal_id: 'd1', inicio: '2026-11-01T10:00:00-03:00', fim: '2026-11-01T11:00:00-03:00', formato: 'online' }

  it('agendar_reuniao manda contato do negócio e pedido_id', async () => {
    state.queues.deals = [{ id: 'd1', contact_id: 'c1' }]
    state.queues.contacts = [{ id: 'c1', name: 'Maria', phone: '+5571999990000' }]
    n8n.mockResolvedValue({ agendamento_id: 'ag-9' })
    const r = await criar(json('POST', { ...corpo, pedido_id: PEDIDO }))
    expect(r.status).toBe(200)
    expect(n8n).toHaveBeenCalledWith('agendar_reuniao', {
      deal_id: 'd1',
      contact_id: 'c1',
      phone: '+5571999990000',
      name: 'Maria',
      inicio: corpo.inicio,
      fim: corpo.fim,
      formato: 'online',
      pedido_id: PEDIDO,
    })
    const s = state.selects.find((x) => x.table === 'contacts')!
    expect(s.eqs).toContainEqual(['organization_id', ORG])
  })

  it('n8n marcou e o CRM falhou: 202 pendente MARCADA_SEM_REGISTRO', async () => {
    state.queues.deals = [{ id: 'd1' }]
    n8n.mockResolvedValue({ agendamento_id: 'ag-9' })
    vi.mocked(registrarReuniao).mockRejectedValueOnce(new Error('db'))
    const r = await criar(json('POST', corpo))
    expect(r.status).toBe(202)
    expect(await r.json()).toEqual({ ok: true, pendente: true, code: 'MARCADA_SEM_REGISTRO' })
  })

  it('pedido_id que não é UUID: 400', async () => {
    state.queues.deals = [{ id: 'd1' }]
    expect((await criar(json('POST', { ...corpo, pedido_id: 'x' }))).status).toBe(400)
    expect(n8n).not.toHaveBeenCalled()
  })

  it('pedir_documentos manda contato do negócio', async () => {
    state.queues.deals = [{ id: 'd1', contact_id: 'c1' }]
    state.queues.contacts = [{ id: 'c1', name: 'Maria', phone: '+5571999990000' }]
    n8n.mockResolvedValue({ ok: true })
    await pedirDocs(json('POST', { deal_id: 'd1' }))
    expect(n8n).toHaveBeenCalledWith('pedir_documentos', {
      deal_id: 'd1',
      contact_id: 'c1',
      phone: '+5571999990000',
      name: 'Maria',
    })
  })

  describe('PATCH', () => {
    beforeEach(() => {
      state.queues.activities = [{ external_ref: 'ag-1', deal_id: 'd1' }]
    })
    const remarcar = { acao: 'remarcar', inicio: '2026-11-02T10:00:00-03:00', fim: '2026-11-02T11:00:00-03:00' }

    it('status nao_compareceu fecha a atividade', async () => {
      await alterar(json('PATCH', { acao: 'status', status: 'nao_compareceu' }), ctx('a1'))
      expect(state.updates.find((x) => x.table === 'activities')!.row).toEqual({
        meeting_status: 'nao_compareceu',
        completed: true,
      })
    })

    it('remarcar manda formato e pedido_id ao n8n e formato ao registro', async () => {
      n8n.mockResolvedValue({ ok: true })
      const r = await alterar(json('PATCH', { ...remarcar, formato: 'presencial', pedido_id: PEDIDO }), ctx('a1'))
      expect(r.status).toBe(200)
      expect(n8n).toHaveBeenCalledWith('remarcar_reuniao', {
        agendamento_id: 'ag-1',
        inicio: remarcar.inicio,
        fim: remarcar.fim,
        formato: 'presencial',
        pedido_id: PEDIDO,
      })
      expect(registrarReuniao).toHaveBeenCalledWith({ admin: true }, expect.objectContaining({ format: 'presencial' }))
    })

    it('n8n remarcou e o CRM falhou: 202 pendente', async () => {
      n8n.mockResolvedValue({ ok: true })
      vi.mocked(registrarReuniao).mockRejectedValueOnce(new Error('db'))
      const r = await alterar(json('PATCH', remarcar), ctx('a1'))
      expect(r.status).toBe(202)
      expect((await r.json()).code).toBe('MARCADA_SEM_REGISTRO')
    })

    it('n8n cancelou e o CRM falhou: 500 FALHA_AO_GRAVAR', async () => {
      n8n.mockResolvedValue({ ok: true })
      vi.mocked(cancelarReuniao).mockRejectedValueOnce(new Error('db'))
      const r = await alterar(json('PATCH', { acao: 'cancelar' }), ctx('a1'))
      expect(r.status).toBe(500)
      expect((await r.json()).code).toBe('FALHA_AO_GRAVAR')
    })
  })
})
