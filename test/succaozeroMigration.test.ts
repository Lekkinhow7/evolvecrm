import { describe, expect, it } from 'vitest'
import { mapAgentLead, parseAgentTimestamp } from '@/scripts/succaozero/mapping'

describe('mapeamento da migração Sucção Zero', () => {
  it('trata timestamp inválido sem inventar data', () => expect(parseAgentTimestamp('inválido')).toBeNull())
  it('preserva @lid como identidade pendente', () => expect(mapAgentLead({ identificador: '123@lid', nome: null, timestamp: null })).toMatchObject({ sourceIdentifier: '123@lid', name: 'Contato sem nome informado', phone: null, pendingIdentity: true }))
  it('produz a mesma chave para repetição do mesmo registro', () => {
    const row = { identificador: '+5511999990000', nome: ' Maria ', timestamp: '2026-09-30T12:00:00Z' }
    expect(mapAgentLead(row).externalEventId).toBe(mapAgentLead(row).externalEventId)
    expect(mapAgentLead(row)).toMatchObject({ phone: '+5511999990000', pendingIdentity: false, name: 'Maria' })
  })
  it('não funde identificador não normalizável', () => expect(mapAgentLead({ identificador: 'desconhecido', nome: 'X', timestamp: null })).toMatchObject({ phone: null, pendingIdentity: true }))
})
