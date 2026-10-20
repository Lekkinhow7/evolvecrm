import { beforeEach, describe, expect, it, vi } from 'vitest'

const moveMock = vi.fn()
vi.mock('@/lib/public-api/dealsMoveStage', () => ({
  moveStageByDealId: (...a: unknown[]) => moveMock(...a),
}))

import { advanceDealToRole, decideAdvance } from './stageRole'

describe('decideAdvance', () => {
  it('negócio ganho não move', () => {
    expect(decideAdvance({ isWon: true, isLost: false, currentOrder: 1, targetOrder: 3 })).toEqual({ move: false, warning: 'negocio_fechado' })
  })
  it('negócio perdido não move', () => {
    expect(decideAdvance({ isWon: false, isLost: true, currentOrder: 1, targetOrder: 3 })).toEqual({ move: false, warning: 'negocio_fechado' })
  })
  it('sem etapa com o papel', () => {
    expect(decideAdvance({ isWon: false, isLost: false, currentOrder: 1, targetOrder: null })).toEqual({ move: false, warning: 'etapa_sem_papel' })
  })
  it('já além da etapa', () => {
    expect(decideAdvance({ isWon: false, isLost: false, currentOrder: 4, targetOrder: 3 })).toEqual({ move: false, warning: 'ja_adiantado' })
  })
  it('já na etapa', () => {
    expect(decideAdvance({ isWon: false, isLost: false, currentOrder: 4, targetOrder: 4 })).toEqual({ move: false, warning: 'ja_adiantado' })
  })
  it('avança', () => {
    expect(decideAdvance({ isWon: false, isLost: false, currentOrder: 2, targetOrder: 4 })).toEqual({ move: true })
  })
  it('etapa atual desconhecida avança', () => {
    expect(decideAdvance({ isWon: false, isLost: false, currentOrder: null, targetOrder: 4 })).toEqual({ move: true })
  })
})

function makeSb(deal: unknown, stages: unknown[]) {
  const calls: Array<{ table: string; eqs: Array<[string, unknown]> }> = []
  const sb = {
    from(table: string) {
      const rec = { table, eqs: [] as Array<[string, unknown]> }
      calls.push(rec)
      const chain: any = {
        select: () => chain,
        eq: (c: string, v: unknown) => { rec.eqs.push([c, v]); return chain },
        maybeSingle: async () => ({ data: deal, error: null }),
        then: (res: (v: unknown) => unknown) => Promise.resolve({ data: stages, error: null }).then(res),
      }
      return chain
    },
  }
  return { sb: sb as any, calls }
}

const base = { organizationId: 'org1', dealId: 'd1', role: 'reuniao_agendada' as const }

describe('advanceDealToRole', () => {
  beforeEach(() => moveMock.mockReset())

  it('move quando a etapa do papel está à frente', async () => {
    moveMock.mockResolvedValue({ ok: true, status: 200, body: {} })
    const { sb, calls } = makeSb(
      { board_id: 'b1', stage_id: 's1', is_won: false, is_lost: false },
      [{ id: 's1', order: 1, role: null }, { id: 's3', order: 3, role: 'reuniao_agendada' }],
    )
    const r = await advanceDealToRole(sb, base)
    expect(r).toEqual({ moved: true })
    expect(moveMock).toHaveBeenCalledWith({ organizationId: 'org1', dealId: 'd1', target: { to_stage_id: 's3' } })
    expect(calls.every((c) => c.eqs.some(([k, v]) => k === 'organization_id' && v === 'org1'))).toBe(true)
  })

  it('não move se já adiantado', async () => {
    const { sb } = makeSb(
      { board_id: 'b1', stage_id: 's4', is_won: false, is_lost: false },
      [{ id: 's3', order: 3, role: 'reuniao_agendada' }, { id: 's4', order: 4, role: null }],
    )
    expect(await advanceDealToRole(sb, base)).toEqual({ moved: false, warning: 'ja_adiantado' })
    expect(moveMock).not.toHaveBeenCalled()
  })

  it('aviso quando funil não tem o papel', async () => {
    const { sb } = makeSb({ board_id: 'b1', stage_id: 's1', is_won: false, is_lost: false }, [{ id: 's1', order: 1, role: null }])
    expect(await advanceDealToRole(sb, base)).toEqual({ moved: false, warning: 'etapa_sem_papel' })
  })

  it('negócio inexistente', async () => {
    const { sb } = makeSb(null, [])
    expect(await advanceDealToRole(sb, base)).toEqual({ moved: false, warning: 'negocio_nao_encontrado' })
  })

  it('falha do move vira aviso', async () => {
    moveMock.mockResolvedValue({ ok: false, status: 422, body: {} })
    const { sb } = makeSb(
      { board_id: 'b1', stage_id: 's1', is_won: false, is_lost: false },
      [{ id: 's1', order: 1, role: null }, { id: 's3', order: 3, role: 'reuniao_agendada' }],
    )
    expect(await advanceDealToRole(sb, base)).toEqual({ moved: false, warning: 'falha_ao_mover' })
  })
})
