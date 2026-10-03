import { isE164, normalizePhoneE164 } from '../../lib/phone'

export interface AgentLeadRow { identificador: string; nome: string | null; timestamp: string | null; [key: string]: unknown }
export interface CanonicalLeadImport { source: 'agent'; externalEventId: string; sourceIdentifier: string; name: string; occurredAt: string | null; phone: string | null; pendingIdentity: boolean }

export function parseAgentTimestamp(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function mapAgentLead(row: AgentLeadRow): CanonicalLeadImport {
  const identifier = String(row.identificador || '').trim()
  if (!identifier) throw new Error('Identificador técnico obrigatório')
  const isLid = identifier.endsWith('@lid')
  const normalized = isLid ? '' : normalizePhoneE164(identifier.replace(/@s\.whatsapp\.net$/, ''))
  const phone = isE164(normalized) ? normalized : null
  return {
    source: 'agent', externalEventId: `agent-lead:${identifier}`, sourceIdentifier: identifier,
    name: row.nome?.trim() || 'Contato sem nome informado', occurredAt: parseAgentTimestamp(row.timestamp),
    phone, pendingIdentity: !phone,
  }
}
