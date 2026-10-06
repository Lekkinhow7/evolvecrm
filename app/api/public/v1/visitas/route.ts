/**
 * @fileoverview Agendamento de visita vindo do atendimento.
 *
 * É esta porta que a IA chama quando o cliente marca a visita na conversa. A
 * partir daqui o CRM faz o resto sozinho: cria a visita no calendário, escolhe
 * o técnico da equipe, gera o link do laudo e programa os dois avisos no
 * WhatsApp dele.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { authPublicApi } from '@/lib/public-api/auth';
import { createStaticAdminClient } from '@/lib/supabase/server';
import { agendarVisita } from '@/lib/visits/agendar';

export const runtime = 'nodejs';

const BodySchema = z
  .object({
    phone: z.string().trim().min(8).max(30).optional(),
    name: z.string().trim().max(120).optional(),
    deal_id: z.string().uuid().optional(),
    starts_at: z.string().min(10),
    ends_at: z.string().min(10).optional(),
    duration_minutes: z.number().int().min(15).max(480).optional(),
    address: z.string().trim().max(300).optional(),
    address_note: z.string().trim().max(300).optional(),
    technician_id: z.string().uuid().optional(),
    title: z.string().trim().max(160).optional(),
    external_ref: z.string().trim().max(200).optional(),
  })
  .refine((v) => Boolean(v.phone || v.deal_id), {
    message: 'Informe o telefone do cliente ou o negócio',
  });

export async function POST(request: Request) {
  const auth = await authPublicApi(request);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', code: 'VALIDATION_ERROR', details: parsed.error.issues.map((i) => i.message) },
      { status: 422 },
    );
  }
  const body = parsed.data;

  const quando = new Date(body.starts_at);
  if (Number.isNaN(quando.getTime())) {
    return NextResponse.json({ error: 'Data da visita inválida', code: 'INVALID_DATE' }, { status: 422 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/+$/, '');

  try {
    const resultado = await agendarVisita(createStaticAdminClient(), {
      organizationId: auth.organizationId,
      phone: body.phone,
      name: body.name,
      dealId: body.deal_id,
      startsAt: quando.toISOString(),
      endsAt: body.ends_at,
      durationMinutes: body.duration_minutes,
      address: body.address,
      addressNote: body.address_note,
      technicianId: body.technician_id,
      title: body.title,
      externalRef: body.external_ref,
      appUrl,
    });

    return NextResponse.json(
      {
        ok: true,
        visita_id: resultado.activityId,
        negocio_id: resultado.dealId,
        contato_id: resultado.contactId,
        tecnico: resultado.technician
          ? { id: resultado.technician.id, nome: resultado.technician.name, whatsapp: resultado.technician.phone }
          : null,
        formulario_url: resultado.formUrl,
        lembretes_programados: resultado.reminders,
        reaproveitou_agendamento: resultado.reused,
        aviso: resultado.technician ? undefined : 'Nenhum técnico ativo cadastrado: a visita foi criada sem responsável e sem lembretes.',
      },
      { status: resultado.reused ? 200 : 201 },
    );
  } catch (erro) {
    console.error('[visitas] falha ao agendar', erro);
    return NextResponse.json({ error: 'Não foi possível agendar a visita', code: 'SCHEDULE_FAILED' }, { status: 500 });
  }
}
