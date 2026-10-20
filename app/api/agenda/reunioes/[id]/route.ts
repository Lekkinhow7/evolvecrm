/**
 * PATCH /api/agenda/reunioes/[id] — remarcar, cancelar (passam pelo n8n) ou
 * marcar a situação (realizada / não compareceu, direto no CRM).
 * `[id]` é o id da atividade no CRM; o n8n recebe o `external_ref` como agendamento_id.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createStaticAdminClient } from '@/lib/supabase/staticAdminClient'
import { chamarAgendaNoN8n } from '@/lib/agenda/n8n'
import { cancelarReuniao, completedDaSituacao, registrarReuniao } from '@/lib/agenda/reunioes'
import {
  DatasDaReuniao,
  autenticarRotaInterna,
  fimDepoisDoInicio,
  respostaFalhaAoGravar,
  respostaFalhaN8n,
  respostaMarcadaSemRegistro,
} from '@/lib/agenda/rotaInterna'

const Corpo = z.discriminatedUnion('acao', [
  DatasDaReuniao.extend({
    acao: z.literal('remarcar'),
    formato: z.enum(['online', 'presencial']).optional(),
    pedido_id: z.string().uuid().optional(),
  }),
  z.object({ acao: z.literal('cancelar') }),
  z.object({ acao: z.literal('status'), status: z.enum(['realizada', 'nao_compareceu']) }),
])

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await autenticarRotaInterna()
  if (auth.erro) return auth.erro
  const { id } = await ctx.params
  const parsed = Corpo.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const corpo = parsed.data
  if (corpo.acao === 'remarcar' && !fimDepoisDoInicio(corpo)) {
    return NextResponse.json({ error: 'O fim deve ser depois do início' }, { status: 400 })
  }

  const { data: atividade } = await auth.sb
    .from('activities')
    .select('id, external_ref, deal_id')
    .eq('organization_id', auth.organizationId)
    .eq('id', id)
    .eq('type', 'MEETING')
    .is('deleted_at', null)
    .maybeSingle()
  if (!atividade) return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 })

  if (corpo.acao === 'status') {
    const { error } = await auth.sb
      .from('activities')
      .update({ meeting_status: corpo.status, completed: completedDaSituacao(corpo.status) })
      .eq('organization_id', auth.organizationId)
      .eq('id', id)
    if (error) return respostaFalhaAoGravar(error)
    return NextResponse.json({ ok: true })
  }

  const externalRef = (atividade.external_ref as string | null) || null
  if (!externalRef) {
    return NextResponse.json({ error: 'Essa reunião não veio do agendamento.', code: 'SEM_AGENDAMENTO' }, { status: 422 })
  }

  if (corpo.acao === 'cancelar') {
    try {
      await chamarAgendaNoN8n('cancelar_reuniao', { agendamento_id: externalRef })
    } catch (e) {
      return respostaFalhaN8n(e)
    }
    try {
      await cancelarReuniao(createStaticAdminClient(), { organizationId: auth.organizationId, externalRef })
    } catch (e) {
      return respostaFalhaAoGravar(e)
    }
    return NextResponse.json({ ok: true })
  }

  let r: { ocupado?: boolean; link?: string }
  try {
    r = await chamarAgendaNoN8n('remarcar_reuniao', {
      agendamento_id: externalRef,
      inicio: corpo.inicio,
      fim: corpo.fim,
      ...(corpo.formato ? { formato: corpo.formato } : {}),
      ...(corpo.pedido_id ? { pedido_id: corpo.pedido_id } : {}),
    })
  } catch (e) {
    return respostaFalhaN8n(e)
  }
  if (r?.ocupado) {
    return NextResponse.json({ error: 'Esse horário já foi ocupado.', code: 'HORARIO_OCUPADO' }, { status: 409 })
  }
  // O n8n já remarcou: falha no CRM não pode pedir para tentar de novo.
  try {
    await registrarReuniao(createStaticAdminClient(), {
      organizationId: auth.organizationId,
      dealId: (atividade.deal_id as string | null) || undefined,
      startsAt: corpo.inicio,
      endsAt: corpo.fim,
      externalRef,
      format: corpo.formato,
      meetingUrl: r?.link,
    })
  } catch (e) {
    return respostaMarcadaSemRegistro(e)
  }
  return NextResponse.json({ ok: true })
}
