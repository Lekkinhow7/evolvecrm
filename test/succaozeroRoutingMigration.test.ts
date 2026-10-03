import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/succaozero/migrations/20260930100000_phase1_routing_and_intake.sql',
)

describe('succao zero routing migration', () => {
  const migration = () => readFileSync(migrationPath, 'utf8').toLowerCase()

  it('expõe os três contratos transacionais da fase 1', () => {
    const sql = migration()
    expect(sql).toContain('function public.succaozero_ingest_lead(p_payload jsonb)')
    expect(sql).toContain('function public.succaozero_set_seller_roster(p_payload jsonb)')
    expect(sql).toContain('function public.succaozero_transfer_opportunity(')
  })

  it('bloqueia o cursor e só o avança após oportunidade nova', () => {
    const sql = migration()
    expect(sql).toContain('for update')
    expect(sql).toContain('update public.succaozero_routing_state')
    expect(sql).toContain('version = version + 1')
  })

  it('mantém evento, contato, oportunidade, projeções e próxima ação na mesma função', () => {
    const sql = migration()
    expect(sql).toContain('insert into public.succaozero_inbound_events')
    expect(sql).toContain('insert into public.contacts')
    expect(sql).toContain('insert into public.deals')
    expect(sql).toContain('insert into public.succaozero_opportunities')
    expect(sql).toContain('insert into public.succaozero_next_actions')
  })

  it('revoga execução pública e concede somente aos papéis autenticados', () => {
    const sql = migration()
    expect(sql).toContain('revoke all on function public.succaozero_ingest_lead(jsonb) from public, anon')
    expect(sql).toContain('grant execute on function public.succaozero_ingest_lead(jsonb) to authenticated, service_role')
  })
})
