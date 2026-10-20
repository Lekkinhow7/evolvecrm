/**
 * PATCH /api/agenda/reunioes/[id] — remarcar, cancelar (passam pelo n8n) ou
 * marcar a situação (realizada / não compareceu, direto no CRM).
 * `[id]` é o id da atividade no CRM; o n8n recebe o `external_ref` como agendamento_id.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createStaticAdminClient } from '@/lib/supabase/staticAdminClient'
import { chamarAgendaNoN8n } from '@/lib/agenda/n8n'
import { cancelarReuniao, registrarReuniao } from '@/lib/agenda/reunioes'
import { autenticarRotaInterna, respostaFalhaN8n } from '@/lib/agenda/rotaInterna'

const Corpo = z.discriminatedUnion('acao', [
  z.object({ acao: z.literal('remarcar'), inicio: z.string().min(1), fim: z.string().min(1) }),
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

  const { data: atividade } = await auth.sb
    .from('activities')
    .select('id, external_ref, deal_id')
    .eq('organization_id', auth.organizationId)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!atividade) return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 })

  if (corpo.acao === 'status') {
    await auth.sb
      .from('activities')
      .update({ meeting_status: corpo.status })
      .eq('organization_id', auth.organizationId)
      .eq('id', id)
    return NextResponse.json({ ok: true })
  }

  const externalRef = (atividade.external_ref as string | null) || null
  if (!externalRef) {
    return NextResponse.json({ error: 'Essa reunião não veio do agendamento.', code: 'SEM_AGENDAMENTO' }, { status: 422 })
  }

  try {
    if (corpo.acao === 'cancelar') {
      await chamarAgendaNoN8n('cancelar_reuniao', { agendamento_id: externalRef })
      await cancelarReuniao(createStaticAdminClient(), { organizationId: auth.organizationId, externalRef })
      return NextResponse.json({ ok: true })
    }

    const r = await chamarAgendaNoN8n<{ ocupado?: boolean; link?: string }>('remarcar_reuniao', {
      agendamento_id: externalRef,
      inicio: corpo.inicio,
      fim: corpo.fim,
    })
    if (r?.ocupado) {
      return NextResponse.json({ error: 'Esse horário já foi ocupado.', code: 'HORARIO_OCUPADO' }, { status: 409 })
    }
    await registrarReuniao(createStaticAdminClient(), {
      organizationId: auth.organizationId,
      dealId: (atividade.deal_id as string | null) || undefined,
      startsAt: corpo.inicio,
      endsAt: corpo.fim,
      externalRef,
      meetingUrl: r?.link,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return respostaFalhaN8n(e)
  }
}
