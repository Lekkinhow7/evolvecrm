/**
 * @fileoverview Agendamento de visita vindo do atendimento.
 *
 * É esta porta que a IA chama quando o cliente marca a visita na conversa. A
 * partir daqui o CRM faz o resto sozinho: cria a visita no calendário, gera o
 * link do laudo e programa os dois avisos no WhatsApp do técnico.
 *
 * Quem é o técnico vem no próprio pedido: a equipe e os horários livres estão
 * no banco do agente, e é a IA que escolhe lá. O CRM só registra.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { authPublicApi } from '@/lib/public-api/auth';
import { createStaticAdminClient } from '@/lib/supabase/server';
import { agendarVisita, cancelarVisita } from '@/lib/visits/agendar';

export const runtime = 'nodejs';

const BodySchema = z
  .object({
    phone: z.string().trim().min(8).max(30).optional(),
    name: z.string().trim().max(120).optional(),
    deal_id: z.string().uuid().optional(),
    starts_at: z.string().min(10).optional(),
    ends_at: z.string().min(10).optional(),
    duration_minutes: z.number().int().min(15).max(480).optional(),
    address: z.string().trim().max(300).optional(),
    address_note: z.string().trim().max(300).optional(),
    tecnico_nome: z.string().trim().min(1).max(120).optional(),
    tecnico_whatsapp: z.string().trim().min(8).max(30).optional(),
    tecnico_ref: z.string().trim().max(120).optional(),
    title: z.string().trim().max(160).optional(),
    external_ref: z.string().trim().max(200).optional(),
    /** Falso quando quem manda o aviso ao técnico é o n8n. */
    programar_lembretes: z.boolean().optional(),
    /** Verdadeiro para receber um link novo a cada pedido. */
    novo_link: z.boolean().optional(),
    /** Qual formulário o link abre. Sem isso, o do laudo. */
    formulario: z.enum(['laudo_visita', 'orcamento', 'venda']).optional(),
    /**
     * Marca que o n8n vai mandar este aviso agora. Só a primeira chamada de cada
     * tipo por visita recebe aviso_ja_enviado=false: as seguintes recebem true,
     * e é isso que impede o técnico de receber o mesmo aviso duas vezes.
     */
    marcar_aviso: z.enum(['visita_2h', 'visita_15min']).optional(),
    /** Verdadeiro quando a visita foi cancelada no atendimento. Pede external_ref. */
    cancelada: z.boolean().optional(),
  })
  .refine((v) => v.cancelada || Boolean(v.phone || v.deal_id), {
    message: 'Informe o telefone do cliente ou o negócio',
  })
  .refine((v) => v.cancelada || Boolean(v.starts_at), {
    message: 'Informe a data da visita',
  })
  .refine((v) => !v.cancelada || Boolean(v.external_ref), {
    message: 'Para cancelar, informe o external_ref da visita',
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

  if (body.cancelada) {
    try {
      const visitaId = await cancelarVisita(createStaticAdminClient(), {
        organizationId: auth.organizationId,
        externalRef: body.external_ref!,
      });
      return NextResponse.json({ ok: true, cancelada: Boolean(visitaId), visita_id: visitaId });
    } catch (erro) {
      console.error('[visitas] falha ao cancelar', erro);
      return NextResponse.json({ error: 'Não foi possível cancelar a visita', code: 'CANCEL_FAILED' }, { status: 500 });
    }
  }

  const quando = new Date(body.starts_at!);
  if (Number.isNaN(quando.getTime())) {
    return NextResponse.json({ error: 'Data da visita inválida', code: 'INVALID_DATE' }, { status: 422 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/+$/, '');

  try {
    const admin = createStaticAdminClient();
    const resultado = await agendarVisita(admin, {
      organizationId: auth.organizationId,
      phone: body.phone,
      name: body.name,
      dealId: body.deal_id,
      startsAt: quando.toISOString(),
      endsAt: body.ends_at,
      durationMinutes: body.duration_minutes,
      address: body.address,
      addressNote: body.address_note,
      technician:
        body.tecnico_nome && body.tecnico_whatsapp
          ? { name: body.tecnico_nome, phone: body.tecnico_whatsapp, ref: body.tecnico_ref ?? null }
          : null,
      title: body.title,
      externalRef: body.external_ref,
      programarLembretes: body.programar_lembretes,
      novoLink: body.novo_link,
      formulario: body.formulario,
      appUrl,
    });

    let avisoJaEnviado: boolean | undefined;
    if (body.marcar_aviso && resultado.activityId) {
      const agora = new Date().toISOString();
      const marca = await admin
        .from('outbound_messages')
        .upsert(
          {
            organization_id: auth.organizationId,
            activity_id: resultado.activityId,
            deal_id: resultado.dealId,
            kind: body.marcar_aviso,
            to_phone: resultado.technician?.phone || 'sem-tecnico',
            body: 'Aviso enviado pelo n8n',
            scheduled_for: agora,
            sent_at: agora,
            attempts: 1,
          },
          { onConflict: 'activity_id,kind', ignoreDuplicates: true },
        )
        .select('id');
      // Se a marcação falhar, o aviso sai mesmo assim: perder o lembrete é pior
      // que mandar duas vezes.
      avisoJaEnviado = marca.error ? false : (marca.data?.length ?? 0) === 0;
      if (marca.error) console.error('[visitas] falha ao marcar aviso', marca.error);
    }

    return NextResponse.json(
      {
        ok: true,
        aviso_ja_enviado: avisoJaEnviado,
        visita_id: resultado.activityId,
        negocio_id: resultado.dealId,
        contato_id: resultado.contactId,
        tecnico: resultado.technician
          ? { nome: resultado.technician.name, whatsapp: resultado.technician.phone, ref: resultado.technician.ref }
          : null,
        formulario_url: resultado.formUrl,
        lembretes_programados: resultado.reminders,
        reaproveitou_agendamento: resultado.reused,
        aviso:
          resultado.technician || resultado.reused
            ? undefined
            : 'O pedido veio sem tecnico_nome e tecnico_whatsapp: a visita foi criada sem responsável e sem lembretes.',
      },
      { status: resultado.reused ? 200 : 201 },
    );
  } catch (erro) {
    console.error('[visitas] falha ao agendar', erro);
    return NextResponse.json({ error: 'Não foi possível agendar a visita', code: 'SCHEDULE_FAILED' }, { status: 500 });
  }
}
