export interface SuccaozeroConfig {
  enabled: boolean
  organizationId: string
  boardKey: string
  projectRef: string
}

export function getSuccaozeroConfig(env: NodeJS.ProcessEnv = process.env): SuccaozeroConfig {
  const enabled = env.SUCCAOZERO_CANONICAL_ENABLED === 'true'
  const organizationId = env.SUCCAOZERO_ORGANIZATION_ID?.trim() ?? ''
  const boardKey = env.SUCCAOZERO_BOARD_KEY?.trim() || 'succaozero'
  const projectRef = env.SUCCAOZERO_SUPABASE_PROJECT_REF?.trim() ?? ''

  if (enabled && (!organizationId || !projectRef)) {
    throw new Error('Configuração canônica Sucção Zero incompleta')
  }

  return { enabled, organizationId, boardKey, projectRef }
}

export function assertSuccaozeroProject(expectedRef: string, actualUrl: string): void {
  const actualRef = new URL(actualUrl).hostname.split('.')[0]
  if (!expectedRef || actualRef !== expectedRef) {
    throw new Error('Projeto Supabase não autorizado para Sucção Zero')
  }
}
