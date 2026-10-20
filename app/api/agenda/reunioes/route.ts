/**
 * POST /api/agenda/reunioes — a equipe marca reunião. O n8n grava primeiro
 * (banco do agente + Google); só então o CRM registra.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createStaticAdminClient } from '@/lib/supabase/staticAdminClient'
import { chamarAgendaNoN8n } from '@/lib/agenda/n8n'
import { registrarReuniao } from '@/lib/agenda/reunioes'
import { autenticarRotaInterna, respostaFalhaN8n } from '@/lib/agenda/rotaInterna'

const Corpo = z.object({
  deal_id: z.string().min(1),
  inicio: z.string().min(1),
  fim: z.string().min(1),
  formato: z.enum(['online', 'presencial']),
})

export async function POST(request: Request) {
  const auth = await autenticarRotaInterna()
  if (auth.erro) return auth.erro
  const parsed = Corpo.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const { deal_id, inicio, fim, formato } = parsed.data

  try {
    const r = await chamarAgendaNoN8n<{ agendamento_id?: string; link?: string; ocupado?: boolean }>(
      'agendar_reuniao',
      { deal_id, inicio, fim, formato },
    )
    if (r?.ocupado) {
      return NextResponse.json({ error: 'Esse horário já foi ocupado.', code: 'HORARIO_OCUPADO' }, { status: 409 })
    }
    if (!r?.agendamento_id) {
      return NextResponse.json(
        { error: 'O n8n não devolveu o id do agendamento.', code: 'N8N_INDISPONIVEL' },
        { status: 502 },
      )
    }
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
    return respostaFalhaN8n(e)
  }
}
