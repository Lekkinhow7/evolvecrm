import { describe, expect, it } from 'vitest'

import { assertSuccaozeroProject, getSuccaozeroConfig } from '@/lib/succaozero/config'

describe('getSuccaozeroConfig', () => {
  it('rejeita feature ativa sem organization id e project ref', () => {
    expect(() => getSuccaozeroConfig({ SUCCAOZERO_CANONICAL_ENABLED: 'true' })).toThrow(
      'Configuração canônica Sucção Zero incompleta',
    )
  })

  it('mantém a integração desligada com defaults seguros quando não configurada', () => {
    expect(getSuccaozeroConfig({})).toEqual({
      enabled: false,
      organizationId: '',
      boardKey: 'succaozero',
      projectRef: '',
    })
  })
})

describe('assertSuccaozeroProject', () => {
  it('rejeita URL de projeto diferente do ref autorizado', () => {
    expect(() => assertSuccaozeroProject('crm-sz-ref', 'https://alice-ref.supabase.co')).toThrow(
      'Projeto Supabase não autorizado para Sucção Zero',
    )
  })

  it('aceita somente o hostname exato do projeto autorizado', () => {
    expect(() => assertSuccaozeroProject('crm-sz-ref', 'https://crm-sz-ref.supabase.co')).not.toThrow()
  })
})
