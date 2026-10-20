/** Deixa o número no formato do WhatsApp: com 55 e com o nono dígito. */
export function normalizarTelefone(bruto: string): string | null {
  const digitos = (bruto || '').replace(/\D/g, '')
  if (!digitos) return null
  const comPais = digitos.startsWith('55') ? digitos : `55${digitos}`
  const corpo = comPais.slice(2)
  if (corpo.length === 10 && /^[6-9]/.test(corpo.slice(2, 3))) {
    return `55${corpo.slice(0, 2)}9${corpo.slice(2)}`
  }
  if (corpo.length < 10 || corpo.length > 11) return null
  return comPais
}

/**
 * Variantes E.164 para procurar o contato: com e sem o nono dígito. Contatos
 * vindos dos webhooks do WhatsApp podem estar guardados sem o 9.
 */
export function variantesE164(bruto: string): string[] {
  const n = normalizarTelefone(bruto)
  if (!n) return []
  const com9 = `+${n}`
  const local = n.slice(4)
  if (local.length === 9 && local.startsWith('9')) return [com9, `+${n.slice(0, 4)}${local.slice(1)}`]
  return [com9]
}

/** Telefone como o WhatsApp entregou: "+" e os dígitos, com 55 só se faltar. */
export function e164Recebido(bruto: string): string | null {
  if (!normalizarTelefone(bruto)) return null
  const d = (bruto || '').replace(/\D/g, '')
  return `+${d.startsWith('55') ? d : `55${d}`}`
}

/** Telefone no formato que o CRM guarda no contato. */
export function paraE164(bruto: string): string | null {
  const n = normalizarTelefone(bruto)
  return n ? `+${n}` : null
}
