export const REQUIRED_CANONICAL_TABLES: readonly string[]

export interface MigrationTargetOptions {
  database: 'crm' | 'agent'
  environment: 'staging' | 'production'
  confirmProject?: string
  env?: Record<string, string | undefined>
}

export interface MigrationTarget {
  connectionString: string
  projectRef: string
  database: 'crm' | 'agent'
  environment: 'staging' | 'production'
}

export function resolveMigrationTarget(options: MigrationTargetOptions): MigrationTarget
export function resolveSqlPath(repoRoot: string, requestedPath: string): string

export interface SchemaReportInput {
  existingTables: string[]
  rlsEnabledTables: string[]
  foreignKeysToEvolve: number
  anonBusinessGrants: number
}

export interface SchemaReport {
  missingTables: string[]
  rlsMissing: string[]
  foreignKeysToEvolve: number
  anonBusinessGrants: number
  ok: boolean
}

export function buildSchemaReport(input: SchemaReportInput): SchemaReport

export interface AgentForeignKeyReportInput {
  crossSchemaForeignKeys: number
  orphanDisponibilidades: number
  orphanSlots: number
  beforeDisponibilidades: number
  afterDisponibilidades: number
  beforeSlots: number
  afterSlots: number
}

export interface AgentForeignKeyReport {
  crossSchemaForeignKeys: number
  orphanDisponibilidades: number
  orphanSlots: number
  countMismatch: number
  ok: boolean
}

export function buildAgentForeignKeyReport(input: AgentForeignKeyReportInput): AgentForeignKeyReport
