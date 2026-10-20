import { describe, expect, it } from 'vitest'
import { addBusinessDays, checkFile, MAX_FILE_BYTES } from './documentRules'

describe('addBusinessDays', () => {
  it('sexta + 2 dias úteis = terça', () => {
    const sexta = new Date(2026, 9, 23)
    const r = addBusinessDays(sexta, 2)
    expect([r.getFullYear(), r.getMonth(), r.getDate()]).toEqual([2026, 9, 27])
    expect(r.getDay()).toBe(2)
  })
  it('sábado + 2 dias úteis = terça', () => {
    const sabado = new Date(2026, 9, 24)
    const r = addBusinessDays(sabado, 2)
    expect([r.getFullYear(), r.getMonth(), r.getDate()]).toEqual([2026, 9, 27])
    expect(r.getDay()).toBe(2)
  })
  it('não altera a data original', () => {
    const sexta = new Date(2026, 9, 23)
    addBusinessDays(sexta, 3)
    expect(sexta.getDate()).toBe(23)
  })
})

describe('checkFile', () => {
  it('rejeita tipo não aceito', () => {
    expect(checkFile({ mimeType: 'video/mp4', size: 10 })).toEqual({
      ok: false,
      reason: 'tipo_nao_aceito',
    })
  })
  it('rejeita arquivo maior que o limite', () => {
    expect(checkFile({ mimeType: 'application/pdf', size: 26 * 1024 * 1024 })).toEqual({
      ok: false,
      reason: 'arquivo_grande',
    })
  })
  it('aceita PDF de 1 MB', () => {
    expect(checkFile({ mimeType: 'application/pdf', size: 1024 * 1024 })).toEqual({ ok: true })
  })
  it('limite é 25 MiB exatos', () => {
    expect(MAX_FILE_BYTES).toBe(26214400)
    expect(checkFile({ mimeType: 'application/pdf', size: MAX_FILE_BYTES })).toEqual({ ok: true })
    expect(checkFile({ mimeType: 'application/pdf', size: MAX_FILE_BYTES + 1 })).toEqual({
      ok: false,
      reason: 'arquivo_grande',
    })
  })
})
