import { beforeEach, describe, expect, it, vi } from 'vitest'

const ORG = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5'

vi.mock('@/lib/public-api/resolve', () => ({
  resolveBoardIdFromKey: vi.fn(async () => 'board-1'),
  resolveFirstStageId: vi.fn(async () => 'stage-1'),
}))
vi.mock('@/lib/agenda/stageRole', () => ({
  advanceDealToRole: vi.fn(async () => ({ moved: true })),
}))

import { advanceDealToRole } from '@/lib/agenda/stageRole'
import { resolveBoardIdFromKey } from '@/lib/public-api/resolve'
import { ReuniaoNaoEncontrada, cancelarReuniao, registrarReuniao, toSaoPauloIso } from './reunioes'

type Handlers = Record<string, { maybeSingle?: unknown[]; single?: unknown[] }>

/** Supabase falso: cada tabela devolve respostas em fila e grava insert/update. */
function fakeSb(handlers: Handlers) {
  const inserts: Array<{ table: string; row: any }> = []
  const updates: Array<{ table: string; row: any }> = []
  const sb = {
    from(table: string) {
      const h = handlers[table] ?? {}
      const b: any = {}
      for (const m of ['select', 'eq', 'is', 'in', 'order', 'limit']) b[m] = () => b
      b.insert = (row: any) => {
        inserts.push({ table, row })
        return b
      }
      b.update = (row: any) => {
        updates.push({ table, row })
        return b
      }
      b.maybeSingle = async () => (h.maybeSingle?.shift() ?? { data: null, error: null })
      b.single = async () => (h.single?.shift() ?? { data: null, error: null })
      b.then = (res: any) => res({ data: null, error: null })
      return b
    },
  }
  return { sb: sb as any, inserts, updates }
}

describe('toSaoPauloIso', () => {
  it('sem fuso vira -03:00', () => {
    expect(toSaoPauloIso('2026-10-20T14:00:00')).toBe('2026-10-20T14:00:00-03:00')
  })
  it('com fuso mantém', () => {
    expect(toSaoPauloIso('2026-10-20T17:00:00Z')).toBe('2026-10-20T17:00:00Z')
    expect(toSaoPauloIso('2026-10-20T14:00:00-03:00')).toBe('2026-10-20T14:00:00-03:00')
  })
})

describe('registrarReuniao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sem negócio aberto cria contato, negócio e a atividade com os padrões', async () => {
    const { sb, inserts } = fakeSb({
      activities: { maybeSingle: [{ data: null }], single: [{ data: { id: 'act-1' } }] },
      contacts: { maybeSingle: [{ data: null }], single: [{ data: { id: 'c-1' } }] },
      deals: { maybeSingle: [{ data: null }], single: [{ data: { id: 'd-1' } }] },
    })
    const r = await registrarReuniao(sb, {
      organizationId: ORG,
      phone: '71993042122',
      name: 'Maria',
      startsAt: '2026-10-20T14:00:00',
      externalRef: 'slot-1',
    })
    expect(r).toMatchObject({ activityId: 'act-1', dealId: 'd-1', contactId: 'c-1', reused: false })
    expect(resolveBoardIdFromKey).toHaveBeenCalledWith({ organizationId: ORG, boardKey: 'alice' })
    expect(inserts.find((i) => i.table === 'contacts')!.row.phone).toBe('+5571993042122')
    const deal = inserts.find((i) => i.table === 'deals')!.row
    expect(deal).toMatchObject({ board_id: 'board-1', stage_id: 'stage-1', contact_id: 'c-1' })
    const act = inserts.find((i) => i.table === 'activities')!.row
    expect(act).toMatchObject({
      type: 'MEETING',
      meeting_status: 'agendada',
      source: 'ia',
      external_ref: 'slot-1',
      title: 'Reunião - Maria',
    })
    expect(act.date).toBe('2026-10-20T17:00:00.000Z')
    expect(act.ends_at).toBe('2026-10-20T18:00:00.000Z')
    expect(advanceDealToRole).toHaveBeenCalledWith(sb, {
      organizationId: ORG,
      dealId: 'd-1',
      role: 'reuniao_agendada',
    })
  })

  it('mesmo external_ref de novo reaproveita e não insere outra atividade', async () => {
    const { sb, inserts, updates } = fakeSb({
      activities: {
        maybeSingle: [{ data: null }, { data: { id: 'act-1', deal_id: 'd-1', contact_id: 'c-1' } }],
        single: [{ data: { id: 'act-1' } }],
      },
      contacts: { maybeSingle: [{ data: { id: 'c-1', name: 'Maria' } }, { data: { id: 'c-1', name: 'Maria' } }] },
      deals: { maybeSingle: [{ data: { id: 'd-1' } }, { data: { id: 'd-1' } }] },
    })
    const entrada = {
      organizationId: ORG,
      phone: '71993042122',
      startsAt: '2026-10-20T14:00:00',
      externalRef: 'slot-1',
    }
    const a = await registrarReuniao(sb, entrada)
    const b = await registrarReuniao(sb, { ...entrada, startsAt: '2026-10-21T10:00:00' })
    expect(a.reused).toBe(false)
    expect(b.reused).toBe(true)
    expect(inserts.filter((i) => i.table === 'activities')).toHaveLength(1)
    const upd = updates.find((u) => u.table === 'activities')!.row
    expect(upd.date).toBe('2026-10-21T13:00:00.000Z')
    expect(upd.meeting_status).toBeUndefined()
  })

  it('status realizada com external_ref existente só troca meeting_status e não move', async () => {
    const { sb, updates } = fakeSb({
      activities: { maybeSingle: [{ data: { id: 'act-1', deal_id: 'd-1', contact_id: 'c-1' } }] },
    })
    const r = await registrarReuniao(sb, {
      organizationId: ORG,
      phone: '71993042122',
      startsAt: '2026-10-20T14:00:00',
      externalRef: 'slot-1',
      status: 'realizada',
    })
    expect(r).toMatchObject({ reused: true, activityId: 'act-1', dealId: 'd-1' })
    expect(updates).toEqual([{ table: 'activities', row: { meeting_status: 'realizada' } }])
    expect(advanceDealToRole).not.toHaveBeenCalled()
  })

  it('falha ao mover vira aviso falha_ao_mover', async () => {
    vi.mocked(advanceDealToRole).mockRejectedValueOnce(new Error('boom'))
    const { sb } = fakeSb({
      activities: { maybeSingle: [{ data: null }], single: [{ data: { id: 'act-1' } }] },
      contacts: { maybeSingle: [{ data: { id: 'c-1', name: 'Maria' } }] },
      deals: { maybeSingle: [{ data: { id: 'd-1' } }] },
    })
    const r = await registrarReuniao(sb, {
      organizationId: ORG,
      phone: '71993042122',
      startsAt: '2026-10-20T14:00:00',
      externalRef: 'slot-2',
    })
    expect(r.warnings).toContain('falha_ao_mover')
  })
})

describe('busca de contato por telefone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  for (const enviado of ['557188417064', '5571988417064']) {
    it(`acha contato guardado sem o 9 quando o n8n manda ${enviado}`, async () => {
      const { sb, inserts } = fakeSb({
        activities: { maybeSingle: [{ data: null }], single: [{ data: { id: 'act-1' } }] },
        contacts: { maybeSingle: [{ data: { id: 'c-9', name: 'Ana' } }] },
        deals: { maybeSingle: [{ data: { id: 'd-9' } }] },
      })
      const r = await registrarReuniao(sb, {
        organizationId: ORG,
        phone: enviado,
        startsAt: '2026-10-20T14:00:00',
        externalRef: 'slot-9',
      })
      expect(r).toMatchObject({ contactId: 'c-9', dealId: 'd-9' })
      expect(inserts.some((i) => i.table === 'contacts')).toBe(false)
    })
  }

  it('consulta as duas variantes (com e sem o 9)', async () => {
    const ins: unknown[][] = []
    const { sb } = fakeSb({
      activities: { maybeSingle: [{ data: null }], single: [{ data: { id: 'a' } }] },
      contacts: { maybeSingle: [{ data: { id: 'c', name: 'Ana' } }] },
      deals: { maybeSingle: [{ data: { id: 'd' } }] },
    })
    const orig = sb.from.bind(sb)
    sb.from = (t: string) => {
      const b = orig(t)
      const i = b.in
      b.in = (...a: unknown[]) => {
        ins.push(a)
        return i(...a)
      }
      return b
    }
    await registrarReuniao(sb, { organizationId: ORG, phone: '557188417064', startsAt: '2026-10-20T14:00:00', externalRef: 's' })
    expect(ins[0]).toEqual(['phone', ['+5571988417064', '+557188417064']])
  })

  it('contato novo guarda o telefone como veio, sem inserir o 9', async () => {
    const { sb, inserts } = fakeSb({
      activities: { maybeSingle: [{ data: null }], single: [{ data: { id: 'a' } }] },
      contacts: { maybeSingle: [{ data: null }], single: [{ data: { id: 'c-new' } }] },
      deals: { maybeSingle: [{ data: null }], single: [{ data: { id: 'd-new' } }] },
    })
    await registrarReuniao(sb, { organizationId: ORG, phone: '557188417064', startsAt: '2026-10-20T14:00:00', externalRef: 's' })
    expect(inserts.find((i) => i.table === 'contacts')!.row.phone).toBe('+557188417064')
  })

  it('erro na busca do contato lança (não cria duplicado)', async () => {
    const { sb, inserts } = fakeSb({
      activities: { maybeSingle: [{ data: null }] },
      contacts: { maybeSingle: [{ data: null, error: new Error('db') }] },
    })
    await expect(
      registrarReuniao(sb, { organizationId: ORG, phone: '71993042122', startsAt: '2026-10-20T14:00:00', externalRef: 's' }),
    ).rejects.toThrow('db')
    expect(inserts).toHaveLength(0)
  })

  it('erro na busca do negócio aberto lança', async () => {
    const { sb, inserts } = fakeSb({
      activities: { maybeSingle: [{ data: null }] },
      contacts: { maybeSingle: [{ data: { id: 'c', name: 'Ana' } }] },
      deals: { maybeSingle: [{ data: null, error: new Error('db2') }] },
    })
    await expect(
      registrarReuniao(sb, { organizationId: ORG, phone: '71993042122', startsAt: '2026-10-20T14:00:00', externalRef: 's' }),
    ).rejects.toThrow('db2')
    expect(inserts).toHaveLength(0)
  })

  it('status de reunião desconhecida sem telefone e data não cria nada', async () => {
    const { sb, inserts } = fakeSb({ activities: { maybeSingle: [{ data: null }] } })
    await expect(
      registrarReuniao(sb, { organizationId: ORG, externalRef: 'nao-existe', status: 'realizada' }),
    ).rejects.toBeInstanceOf(ReuniaoNaoEncontrada)
    expect(inserts).toHaveLength(0)
  })
})

describe('cancelarReuniao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('marca cancelada sem mover o negócio', async () => {
    const { sb, updates } = fakeSb({ activities: { maybeSingle: [{ data: { id: 'act-1' } }] } })
    const id = await cancelarReuniao(sb, { organizationId: ORG, externalRef: 'slot-1' })
    expect(id).toBe('act-1')
    expect(updates).toEqual([{ table: 'activities', row: { meeting_status: 'cancelada' } }])
    expect(advanceDealToRole).not.toHaveBeenCalled()
  })
  it('devolve null se não existe', async () => {
    const { sb } = fakeSb({})
    expect(await cancelarReuniao(sb, { organizationId: ORG, externalRef: 'x' })).toBeNull()
  })
})
