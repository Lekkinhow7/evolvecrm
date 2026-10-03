import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { assertSuccaozeroProject, getSuccaozeroConfig } from '@/lib/succaozero/config'

describe('isolamento do rollout Sucção Zero', () => {
  it('mantém feature desligada por padrão', () => expect(getSuccaozeroConfig({} as NodeJS.ProcessEnv).enabled).toBe(false))
  it('rejeita project ref da Alice', () => expect(() => assertSuccaozeroProject('dcjyoxbchwomltpsgviu','https://iuoesrnvzakrloclzjto.supabase.co')).toThrow(/não autorizado/i))
  it('exige organização nas rotas e relacionamento público', () => {
    const events = readFileSync(path.resolve(process.cwd(),'app/api/public/v1/succaozero/events/route.ts'),'utf8')
    const deals = readFileSync(path.resolve(process.cwd(),'app/api/public/v1/deals/route.ts'),'utf8')
    expect(events).toContain('auth.organizationId !== config.organizationId')
    expect(deals).toContain('RELATIONSHIP_SCOPE_ERROR')
  })
  it('mantém tabelas de negócio no namespace succaozero', () => {
    const migration = readFileSync(path.resolve(process.cwd(),'supabase/succaozero/migrations/20260930090000_phase1_foundation.sql'),'utf8').toLowerCase()
    expect(migration).not.toMatch(/references public\.evolve_/)
  })
})
