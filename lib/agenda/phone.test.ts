import { describe, expect, it } from 'vitest'
import { normalizarTelefone, paraE164 } from './phone'

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
  it('paraE164 devolve +55...', () => {
    expect(paraE164('71993042122')).toBe('+5571993042122')
    expect(paraE164('abc')).toBeNull()
  })
})
