import { describe, expect, it } from 'vitest'
import type { DealView } from '@/types'
import { mudancasForaDaEtapa, normalizarDealDoRealtime } from './dealsRealtime'

const noCache = {
  id: 'd1',
  title: 'Casa Azul',
  value: 1000,
  status: 'stage-1',
  awaitingDocuments: false,
} as unknown as DealView

describe('normalizarDealDoRealtime', () => {
  it('mapeia awaiting_documents, stage_id e datas para o formato do cache', () => {
    const n = normalizarDealDoRealtime({
      id: 'd1',
      stage_id: 'stage-2',
      awaiting_documents: true,
      updated_at: '2026-10-19T10:00:00Z',
      is_won: false,
      value: 10,
    })
    expect(n).toEqual({
      id: 'd1',
      status: 'stage-2',
      awaitingDocuments: true,
      updatedAt: '2026-10-19T10:00:00Z',
      isWon: false,
      value: 10,
    })
  })
})

describe('mudancasForaDaEtapa', () => {
  it('etapa igual mas aguardando documentos mudou: devolve a mudança', () => {
    const n = normalizarDealDoRealtime({ id: 'd1', stage_id: 'stage-1', awaiting_documents: true, value: 1000 })
    expect(mudancasForaDaEtapa(noCache, n)).toEqual({ awaitingDocuments: true })
  })

  it('valor mudou: devolve o valor', () => {
    const n = normalizarDealDoRealtime({ id: 'd1', stage_id: 'stage-1', value: 2500 })
    expect(mudancasForaDaEtapa(noCache, n)).toEqual({ value: 2500 })
  })

  it('nada mudou fora da etapa: vazio', () => {
    const n = normalizarDealDoRealtime({ id: 'd1', stage_id: 'stage-1', value: 1000, awaiting_documents: false, title: 'Casa Azul' })
    expect(mudancasForaDaEtapa(noCache, n)).toEqual({})
  })
})
