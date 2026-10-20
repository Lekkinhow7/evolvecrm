import { describe, expect, it } from 'vitest'
import { e164Recebido, normalizarTelefone, paraE164, variantesE164 } from './phone'

describe('phone', () => {
  it('acrescenta o nono dígito', () => {
    expect(normalizarTelefone('557193042122')).toBe('5571993042122')
  })
  it('acrescenta o 55', () => {
    expect(normalizarTelefone('(71) 99304-2122')).toBe('5571993042122')
  })
  it('rejeita número curto ou vazio', () => {
    expect(normalizarTelefone('123')).toBeNull()
    expect(normalizarTelefone('')).toBeNull()
  })
  it('variantesE164 dá com e sem o 9', () => {
    expect(variantesE164('557188417064')).toEqual(['+5571988417064', '+557188417064'])
    expect(variantesE164('abc')).toEqual([])
  })
  it('e164Recebido não insere o 9', () => {
    expect(e164Recebido('557188417064')).toBe('+557188417064')
    expect(e164Recebido('7188417064')).toBe('+557188417064')
  })
  it('paraE164 devolve +55...', () => {
    expect(paraE164('71993042122')).toBe('+5571993042122')
    expect(paraE164('abc')).toBeNull()
  })
})
