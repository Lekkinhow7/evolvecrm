import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const code = () => readFileSync(path.resolve(process.cwd(), 'app/api/succaozero/next-actions/route.ts'), 'utf8')

describe('API de próximas ações Sucção Zero', () => {
  it('isola organização e carteira do vendedor', () => {
    const source = code()
    expect(source).toContain(".eq('organization_id', auth.profile.organization_id)")
    expect(source).toContain(".eq('owner_profile_id', auth.profile.id)")
    expect(source).toContain("action.data.executor_profile_id !== auth.profile.id")
  })
  it('calcula hoje no fuso de São Paulo e mantém sem ação separado', () => {
    const source = code()
    expect(source).toContain("timeZone: 'America/Sao_Paulo'")
    expect(source).toContain("filter.data === 'missing'")
    expect(source).toContain('!openByOpportunity.has(item.id)')
  })
  it('registra criação, conclusão e exceção no histórico', () => {
    const source = code()
    expect(source).toContain("event_type: 'next_action.created'")
    expect(source).toContain('`next_action.${parsed.data.outcome}`')
    expect(source).toContain('Exceção exige justificativa')
  })
})
