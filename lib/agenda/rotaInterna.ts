/**
 * @fileoverview Autenticação das rotas internas da agenda: usuário logado
 * (cliente Supabase do servidor) e organização vinda do perfil.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AgendaN8nError } from '@/lib/agenda/n8n'

export async function autenticarRotaInterna() {
  const sb = await createClient()
  const {
    data: { user },
    error,
  } = await sb.auth.getUser()
  if (error || !user) {
    return { erro: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const { data: perfil } = await sb.from('profiles').select('organization_id').eq('id', user.id).maybeSingle()
  const organizationId = (perfil?.organization_id as string | undefined) || null
  if (!organizationId) {
    return { erro: NextResponse.json({ error: 'Profile not found' }, { status: 404 }) }
  }
  return { sb, organizationId }
}

/** Resposta padrão quando o n8n não atende: nada foi gravado. */
export function respostaFalhaN8n(erro: unknown) {
  if (erro instanceof AgendaN8nError) {
    return NextResponse.json(
      { error: 'O n8n não respondeu. Nada foi gravado, tente de novo.', code: 'N8N_INDISPONIVEL' },
      { status: 502 },
    )
  }
  console.error('[agenda] erro inesperado', erro)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
