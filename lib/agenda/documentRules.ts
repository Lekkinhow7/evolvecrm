/**
 * Regras puras dos documentos da agenda: prazo em dias úteis e validação de arquivo.
 * Usa aritmética de data local (sem biblioteca externa). Feriados não são considerados.
 */

export const ACCEPTED_MIME: string[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const MAX_FILE_BYTES = 26214400

export type CheckFileResult =
  | { ok: true }
  | { ok: false; reason: 'tipo_nao_aceito' | 'arquivo_grande' }

/** Soma `days` dias úteis (segunda a sexta) a partir de `from`, mantendo a hora local. */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from.getTime())
  let remaining = days
  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) remaining--
  }
  return result
}

export function checkFile(f: { mimeType: string; size: number }): CheckFileResult {
  if (!ACCEPTED_MIME.includes(f.mimeType)) return { ok: false, reason: 'tipo_nao_aceito' }
  if (f.size > MAX_FILE_BYTES) return { ok: false, reason: 'arquivo_grande' }
  return { ok: true }
}
