/**
 * @fileoverview Porta de reuniões: o n8n/IA chama aqui para pôr reuniões na
 * agenda da Alice. Repetir o pedido com o mesmo `external_ref` não duplica.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { authPublicApi } from '@/lib/public-api/auth'
import { createStaticAdminClient } from '@/lib/supabase/server'
import { ReuniaoNaoEncontrada, cancelarReuniao, registrarReuniao, toSaoPauloIso } from '@/lib/agenda/reunioes'

export const runtime = 'nodejs'

const BodySchema = z
  .object({
    phone: z.string().trim().min(8).max(30).optional(),
    name: z.string().trim().max(120).optional(),
    deal_id: z.string().uuid().optional(),
    starts_at: z.string().min(10).optional(),
    ends_at: z.string().min(10).optional(),
    duration_minutes: z.number().int().min(15).max(480).optional(),
    external_ref: z.string().trim().min(1).max(200),
    format: z.enum(['online', 'presencial']).optional(),
    meeting_url: z.string().trim().url().max(500).optional(),
    address: z.string().trim().max(300).optional(),
    description: z.string().trim().max(4000).optional(),
    origem: z.enum(['ia', 'equipe']).optional(),
    status: z.enum(['realizada', 'nao_compareceu']).optional(),
    cancelada: z.boolean().optional(),
  })
  .refine((v) => v.cancelada || v.status || Boolean(v.phone || v.deal_id), {
    message: 'Informe o telefone do cliente ou o negócio',
  })
  .refine((v) => v.cancelada || v.status || Boolean(v.starts_at), {
    message: 'Informe a data da reunião',
  })

export async function POST(request: Request) {
  const auth = await authPublicApi(request)
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status })

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', code: 'VALIDATION_ERROR', details: parsed.error.issues.map((i) => i.message) },
      { status: 422 },
    )
  }
  const body = parsed.data

  if (body.cancelada) {
    try {
      const id = await cancelarReuniao(createStaticAdminClient(), {
        organizationId: auth.organizationId,
        externalRef: body.external_ref,
      })
      return NextResponse.json({ ok: true, cancelada: Boolean(id), reuniao_id: id })
    } catch (erro) {
      console.error('[reunioes] falha ao cancelar', erro)
      return NextResponse.json({ error: 'Não foi possível cancelar a reunião', code: 'CANCEL_FAILED' }, { status: 500 })
    }
  }

  if (body.starts_at && Number.isNaN(new Date(toSaoPauloIso(body.starts_at)).getTime())) {
    return NextResponse.json({ error: 'Data da reunião inválida', code: 'INVALID_DATE' }, { status: 422 })
  }

  try {
    const r = await registrarReuniao(createStaticAdminClient(), {
      organizationId: auth.organizationId,
      phone: body.phone,
      dealId: body.deal_id,
      name: body.name,
      startsAt: body.starts_at,
      endsAt: body.ends_at,
      durationMinutes: body.duration_minutes,
      externalRef: body.external_ref,
      format: body.format,
      meetingUrl: body.meeting_url,
      address: body.address,
      description: body.description,
      origem: body.origem,
      status: body.status,
    })
    return NextResponse.json(
      {
        ok: true,
        reuniao_id: r.activityId,
        deal_id: r.dealId,
        contact_id: r.contactId,
        reaproveitada: r.reused,
        avisos: r.warnings,
      },
      { status: r.reused ? 200 : 201 },
    )
  } catch (erro) {
    if (erro instanceof ReuniaoNaoEncontrada) {
      return NextResponse.json({ error: 'Reunião não encontrada', code: 'REUNIAO_NAO_ENCONTRADA' }, { status: 404 })
    }
    console.error('[reunioes] falha ao registrar', erro)
    return NextResponse.json({ error: 'Não foi possível registrar a reunião', code: 'SCHEDULE_FAILED' }, { status: 500 })
  }
}
