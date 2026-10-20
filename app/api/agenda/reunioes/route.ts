/**
 * POST /api/agenda/reunioes — a equipe marca reunião. O n8n grava primeiro
 * (banco do agente + Google); só então o CRM registra.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createStaticAdminClient } from '@/lib/supabase/staticAdminClient'
import { chamarAgendaNoN8n } from '@/lib/agenda/n8n'
import { registrarReuniao } from '@/lib/agenda/reunioes'
import {
  DatasDaReuniao,
  autenticarRotaInterna,
  contatoDoNegocio,
  fimDepoisDoInicio,
  respostaFalhaN8n,
  respostaMarcadaSemRegistro,
} from '@/lib/agenda/rotaInterna'

const Corpo = DatasDaReuniao.extend({
  deal_id: z.string().min(1),
  formato: z.enum(['online', 'presencial']),
  pedido_id: z.string().uuid().optional(),
}).refine(fimDepoisDoInicio, { message: 'O fim deve ser depois do início' })

export async function POST(request: Request) {
  const auth = await autenticarRotaInterna()
  if (auth.erro) return auth.erro
  const parsed = Corpo.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const { deal_id, inicio, fim, formato, pedido_id } = parsed.data

  const { data: negocio } = await auth.sb
    .from('deals')
    .select('id, contact_id')
    .eq('organization_id', auth.organizationId)
    .eq('id', deal_id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!negocio) return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })
  const contato = await contatoDoNegocio(auth.sb, auth.organizationId, negocio.contact_id as string | null)

  let r: { agendamento_id?: string; link?: string; ocupado?: boolean }
  try {
    r = await chamarAgendaNoN8n('agendar_reuniao', {
      deal_id,
      ...contato,
      inicio,
      fim,
      formato,
      ...(pedido_id ? { pedido_id } : {}),
    })
  } catch (e) {
    return respostaFalhaN8n(e)
  }
  if (r?.ocupado) {
    return NextResponse.json({ error: 'Esse horário já foi ocupado.', code: 'HORARIO_OCUPADO' }, { status: 409 })
  }
  if (!r?.agendamento_id) {
    return NextResponse.json(
      { error: 'O n8n não devolveu o id do agendamento.', code: 'N8N_INDISPONIVEL' },
      { status: 502 },
    )
  }

  // Daqui em diante o n8n já marcou: falha no CRM não pode pedir para tentar de novo.
  try {
    const reuniao = await registrarReuniao(createStaticAdminClient(), {
      organizationId: auth.organizationId,
      dealId: deal_id,
      startsAt: inicio,
      endsAt: fim,
      externalRef: r.agendamento_id,
      format: formato,
      meetingUrl: formato === 'online' ? r.link : undefined,
      origem: 'equipe',
    })
    return NextResponse.json({ ok: true, reuniao_id: reuniao.activityId })
  } catch (e) {
    return respostaMarcadaSemRegistro(e)
  }
}
