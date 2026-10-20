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

/** Telefone no formato que o CRM guarda no contato. */
export function paraE164(bruto: string): string | null {
  const n = normalizarTelefone(bruto)
  return n ? `+${n}` : null
}
