import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import {
  REQUIRED_CANONICAL_TABLES,
  buildAgentForeignKeyReport,
  buildSchemaReport,
  resolveMigrationTarget,
  resolveSqlPath,
} from '../scripts/succaozero/guards.mjs'

const CRM_URL = 'postgresql://postgres:secret@db.crm-sz-ref.supabase.co:5432/postgres'
const AGENT_URL = 'postgresql://postgres:secret@db.agent-sz-ref.supabase.co:5432/postgres'

describe('resolveMigrationTarget', () => {
  const env = {
    SUCCAOZERO_CRM_DATABASE_URL: CRM_URL,
    SUCCAOZERO_AGENT_DATABASE_URL: AGENT_URL,
    SUCCAOZERO_SUPABASE_PROJECT_REF: 'crm-sz-ref',
    SUCCAOZERO_AGENT_SUPABASE_PROJECT_REF: 'agent-sz-ref',
  }

  it('seleciona somente a conexão cujo hostname corresponde ao ref autorizado', () => {
    expect(resolveMigrationTarget({ database: 'crm', environment: 'staging', env })).toMatchObject({
      connectionString: CRM_URL,
      projectRef: 'crm-sz-ref',
      database: 'crm',
    })
  })

  it('rejeita conexão do projeto Alice mesmo quando fornecida como CRM', () => {
    expect(() => resolveMigrationTarget({
      database: 'crm',
      environment: 'staging',
      env: { ...env, SUCCAOZERO_CRM_DATABASE_URL: 'postgresql://postgres:secret@db.alice-ref.supabase.co/postgres' },
    })).toThrow('Projeto Supabase não autorizado para Sucção Zero')
  })

  it('exige confirmação textual do project ref em produção', () => {
    expect(() => resolveMigrationTarget({ database: 'agent', environment: 'production', env })).toThrow(
      'Confirmação do project ref obrigatória em produção',
    )
  })
})

describe('resolveSqlPath', () => {
  it('aceita somente SQL dentro de supabase/succaozero', () => {
    const root = 'C:/repo'
    expect(resolveSqlPath(root, 'supabase/succaozero/migrations/001.sql')).toBe(
      'C:\\repo\\supabase\\succaozero\\migrations\\001.sql',
    )
    expect(() => resolveSqlPath(root, 'supabase/migrations/001.sql')).toThrow(
      'Migration fora de supabase/succaozero',
    )
  })
})

describe('buildSchemaReport', () => {
  it('lista tabelas ausentes, RLS ausente, FKs Evolve e grants anon', () => {
    const report = buildSchemaReport({
      existingTables: REQUIRED_CANONICAL_TABLES.slice(0, 2),
      rlsEnabledTables: REQUIRED_CANONICAL_TABLES.slice(0, 1),
      foreignKeysToEvolve: 2,
      anonBusinessGrants: 1,
    })

    expect(report.missingTables).toEqual(REQUIRED_CANONICAL_TABLES.slice(2))
    expect(report.rlsMissing).toEqual(REQUIRED_CANONICAL_TABLES.slice(1))
    expect(report.foreignKeysToEvolve).toBe(2)
    expect(report.anonBusinessGrants).toBe(1)
    expect(report.ok).toBe(false)
  })
})

describe('buildAgentForeignKeyReport', () => {
  it('falha quando restam vínculos cruzados, órfãos ou alteração de contagem', () => {
    expect(buildAgentForeignKeyReport({
      crossSchemaForeignKeys: 1,
      orphanDisponibilidades: 0,
      orphanSlots: 2,
      beforeDisponibilidades: 5,
      afterDisponibilidades: 4,
      beforeSlots: 20,
      afterSlots: 20,
    })).toEqual({
      crossSchemaForeignKeys: 1,
      orphanDisponibilidades: 0,
      orphanSlots: 2,
      countMismatch: 1,
      ok: false,
    })
  })
})

describe('phase 1 foundation migration', () => {
  const migration = readFileSync(
    path.resolve(
      process.cwd(),
      'supabase/succaozero/migrations/20260930090000_phase1_foundation.sql',
    ),
    'utf8',
  ).toLowerCase()

  it('concede acesso às tabelas somente para authenticated e revoga anon', () => {
    expect(migration).toContain('grant select, insert, update, delete on public.succaozero_contacts to authenticated')
    expect(migration).toContain('revoke all on public.succaozero_contacts from anon')
  })

  it('protege relações canônicas contra mistura entre organizações', () => {
    expect(migration).toContain('create function public.succaozero_validate_relationship_scope()')
    expect(migration).toContain('create trigger succaozero_opportunities_relationship_scope')
    expect(migration).toContain('create trigger succaozero_customer_contacts_relationship_scope')
    expect(migration).toContain('create trigger succaozero_opportunity_pools_relationship_scope')
  })
})
