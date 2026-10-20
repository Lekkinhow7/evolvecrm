/**
 * @fileoverview Autenticação das rotas internas da agenda: usuário logado
 * (cliente Supabase do servidor) e organização vinda do perfil.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
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

const ehDataIso = (s: string) => /^\d{4}-\d{2}-\d{2}T/.test(s) && !Number.isNaN(Date.parse(s))

/** Início e fim em ISO 8601 (o fim depois do início se confere com fimDepoisDoInicio). */
export const DatasDaReuniao = z.object({
  inicio: z.string().refine(ehDataIso, 'Data de início inválida'),
  fim: z.string().refine(ehDataIso, 'Data de fim inválida'),
})
export const fimDepoisDoInicio = (v: { inicio: string; fim: string }) => Date.parse(v.fim) > Date.parse(v.inicio)

export function respostaFalhaAoGravar(erro: unknown) {
  console.error('[agenda] falha ao gravar no CRM', erro)
  return NextResponse.json(
    { error: 'Não foi possível salvar no CRM', code: 'FALHA_AO_GRAVAR' },
    { status: 500 },
  )
}

/**
 * O n8n já marcou (ou remarcou) mas o CRM não conseguiu registrar. Não é para
 * tentar de novo (reservaria duas vezes): a reunião chega pela porta pública.
 */
export function respostaMarcadaSemRegistro(erro: unknown) {
  console.error('[agenda] n8n marcou mas o CRM não registrou', erro)
  return NextResponse.json({ ok: true, pendente: true, code: 'MARCADA_SEM_REGISTRO' }, { status: 202 })
}

/** Contato do negócio para o n8n saber com quem falar (campos nulos se não houver). */
export async function contatoDoNegocio(
  sb: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  contactId: string | null,
): Promise<{ contact_id: string | null; phone: string | null; name: string | null }> {
  if (!contactId) return { contact_id: null, phone: null, name: null }
  const { data } = await sb
    .from('contacts')
    .select('id, name, phone')
    .eq('organization_id', organizationId)
    .eq('id', contactId)
    .is('deleted_at', null)
    .maybeSingle()
  return {
    contact_id: contactId,
    phone: (data?.phone as string | null) || null,
    name: (data?.name as string | null) || null,
  }
}
