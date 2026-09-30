import path from 'node:path'

export const REQUIRED_CANONICAL_TABLES = Object.freeze([
  'succaozero_contacts',
  'succaozero_customers',
  'succaozero_customer_contacts',
  'succaozero_locations',
  'succaozero_pools',
  'succaozero_opportunities',
  'succaozero_opportunity_pools',
  'succaozero_next_actions',
  'succaozero_commercial_events',
  'succaozero_inbound_events',
  'succaozero_seller_roster',
  'succaozero_routing_state',
  'succaozero_commercial_settings',
])

function projectRefFromConnectionString(connectionString) {
  let hostname = ''
  try {
    hostname = new URL(connectionString).hostname.toLowerCase()
  } catch {
    throw new Error('URL de conexão Sucção Zero inválida')
  }

  const labels = hostname.split('.')
  if (labels[0] === 'db' && labels[2] === 'supabase' && labels[3] === 'co') return labels[1] ?? ''
  if (labels[1] === 'supabase' && labels[2] === 'co') return labels[0] ?? ''
  return ''
}

export function resolveMigrationTarget({ database, environment, confirmProject, env = process.env }) {
  if (database !== 'crm' && database !== 'agent') throw new Error('Banco deve ser crm ou agent')
  if (environment !== 'staging' && environment !== 'production') {
    throw new Error('Ambiente deve ser staging ou production')
  }

  const connectionString = database === 'crm'
    ? env.SUCCAOZERO_CRM_DATABASE_URL?.trim()
    : env.SUCCAOZERO_AGENT_DATABASE_URL?.trim()
  const projectRef = database === 'crm'
    ? env.SUCCAOZERO_SUPABASE_PROJECT_REF?.trim()
    : env.SUCCAOZERO_AGENT_SUPABASE_PROJECT_REF?.trim()

  if (!connectionString || !projectRef) throw new Error('Configuração de banco Sucção Zero incompleta')
  if (projectRefFromConnectionString(connectionString) !== projectRef) {
    throw new Error('Projeto Supabase não autorizado para Sucção Zero')
  }
  if (environment === 'production' && confirmProject !== projectRef) {
    throw new Error('Confirmação do project ref obrigatória em produção')
  }

  return { connectionString, projectRef, database, environment }
}

export function resolveSqlPath(repoRoot, requestedPath) {
  const allowedRoot = path.resolve(repoRoot, 'supabase', 'succaozero')
  const resolved = path.resolve(repoRoot, requestedPath)
  const relative = path.relative(allowedRoot, resolved)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || path.extname(resolved) !== '.sql') {
    throw new Error('Migration fora de supabase/succaozero')
  }
  return resolved
}

export function buildSchemaReport({ existingTables, rlsEnabledTables, foreignKeysToEvolve, anonBusinessGrants }) {
  const existing = new Set(existingTables)
  const withRls = new Set(rlsEnabledTables)
  const missingTables = REQUIRED_CANONICAL_TABLES.filter((table) => !existing.has(table))
  const rlsMissing = REQUIRED_CANONICAL_TABLES.filter((table) => !withRls.has(table))
  return {
    missingTables,
    rlsMissing,
    foreignKeysToEvolve,
    anonBusinessGrants,
    ok: missingTables.length === 0
      && rlsMissing.length === 0
      && foreignKeysToEvolve === 0
      && anonBusinessGrants === 0,
  }
}

export function buildAgentForeignKeyReport(input) {
  const countMismatch = Number(
    input.beforeDisponibilidades !== input.afterDisponibilidades
    || input.beforeSlots !== input.afterSlots,
  )
  return {
    crossSchemaForeignKeys: input.crossSchemaForeignKeys,
    orphanDisponibilidades: input.orphanDisponibilidades,
    orphanSlots: input.orphanSlots,
    countMismatch,
    ok: input.crossSchemaForeignKeys === 0
      && input.orphanDisponibilidades === 0
      && input.orphanSlots === 0
      && countMismatch === 0,
  }
}
