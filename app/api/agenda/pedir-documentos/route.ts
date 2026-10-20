/**
 * POST /api/agenda/pedir-documentos — o n8n pede mais documentos ao cliente;
 * se atender, o negócio fica "aguardando documentos".
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { chamarAgendaNoN8n } from '@/lib/agenda/n8n'
import { autenticarRotaInterna, respostaFalhaAoGravar, respostaFalhaN8n } from '@/lib/agenda/rotaInterna'

const Corpo = z.object({ deal_id: z.string().min(1) })

export async function POST(request: Request) {
  const auth = await autenticarRotaInterna()
  if (auth.erro) return auth.erro
  const parsed = Corpo.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const { deal_id } = parsed.data

  const { data: negocio } = await auth.sb
    .from('deals')
    .select('id')
    .eq('organization_id', auth.organizationId)
    .eq('id', deal_id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!negocio) return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })

  try {
    await chamarAgendaNoN8n('pedir_documentos', { deal_id })
  } catch (e) {
    return respostaFalhaN8n(e)
  }
  const { error } = await auth.sb
    .from('deals')
    .update({ awaiting_documents: true })
    .eq('organization_id', auth.organizationId)
    .eq('id', deal_id)
  if (error) return respostaFalhaAoGravar(error)
  return NextResponse.json({ ok: true })
}
