/**
 * @fileoverview Cria o link assinado de um formulário.
 *
 * Quem recebe o link abre o formulário no celular sem ter login, só daquele
 * registro e só até o vencimento. O token em si nunca é guardado: no banco
 * fica o resumo criptográfico dele.
 */

import { createHash, randomBytes } from 'node:crypto';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isAllowedOrigin } from '@/lib/security/sameOrigin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const BodySchema = z
  .object({
    formId: z.string().uuid(),
    dealId: z.string().uuid().optional(),
    activityId: z.string().uuid().optional(),
    recipientLabel: z.string().trim().max(120).optional(),
    recipientPhone: z.string().trim().max(30).optional(),
    expiresInHours: z.number().int().min(1).max(720).default(168),
    /** Deixa os lembretes da visita prontos na fila de envio. */
    agendarLembretes: z.boolean().optional(),
  })
  .refine((v) => Boolean(v.dealId || v.activityId), {
    message: 'Informe o negócio ou a visita',
  });

/** Deixa o número no formato do WhatsApp: com 55 e com o nono dígito. */
function normalizarTelefone(bruto: string): string | null {
  const digitos = bruto.replace(/\D/g, '');
  if (!digitos) return null;
  const comPais = digitos.startsWith('55') ? digitos : `55${digitos}`;
  const corpo = comPais.slice(2);
  if (corpo.length === 10 && /^[6-9]/.test(corpo.slice(2, 3))) {
    return `55${corpo.slice(0, 2)}9${corpo.slice(2)}`;
  }
  if (corpo.length < 10 || corpo.length > 11) return null;
  return comPais;
}

/**
 * Põe na fila os dois avisos da visita: duas horas antes e quinze minutos
 * antes. Reagendar a visita regrava os horários, e o horário que já passou não
 * entra na fila para não disparar aviso atrasado.
 */
async function agendarLembretesDaVisita(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dados: {
    organizationId: string;
    activityId: string;
    dealId?: string;
    formLinkId: string;
    formName: string;
    telefone: string;
    url: string;
  },
): Promise<number> {
  const telefone = normalizarTelefone(dados.telefone);
  if (!telefone) return 0;

  const consulta = await supabase
    .from('activities')
    .select('title, date, address, address_note, technician_label')
    .eq('id', dados.activityId)
    .maybeSingle();
  const visita = consulta.data;
  if (consulta.error || !visita?.date) return 0;

  const quando = new Date(visita.date as string);
  const hora = quando.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const endereco = [visita.address, visita.address_note].filter(Boolean).join(' - ');
  const nome = (visita.technician_label as string) || '';

  const corpo = (abertura: string) =>
    [
      abertura,
      '',
      `Visita: ${visita.title}`,
      `Quando: ${hora}`,
      endereco ? `Endereço: ${endereco}` : null,
      '',
      `Formulário para preencher no fim da visita:`,
      dados.url,
    ]
      .filter((l) => l !== null)
      .join('\n');

  const agora = Date.now();
  const planos = [
    {
      kind: 'visita_2h',
      scheduled_for: new Date(quando.getTime() - 2 * 60 * 60 * 1000),
      body: corpo(`${nome ? `Oi, ${nome}! ` : 'Oi! '}Sua visita é daqui a duas horas.`),
    },
    {
      kind: 'visita_15min',
      scheduled_for: new Date(quando.getTime() - 15 * 60 * 1000),
      body: corpo(`${nome ? `${nome}, ` : ''}faltam 15 minutos para a visita. Deixe este link aberto para preencher o laudo assim que terminar.`),
    },
  ].filter((p) => p.scheduled_for.getTime() > agora);

  if (!planos.length) return 0;

  const { error } = await supabase.from('outbound_messages').upsert(
    planos.map((p) => ({
      organization_id: dados.organizationId,
      activity_id: dados.activityId,
      deal_id: dados.dealId ?? null,
      form_link_id: dados.formLinkId,
      kind: p.kind,
      to_phone: telefone,
      body: p.body,
      scheduled_for: p.scheduled_for.toISOString(),
      sent_at: null,
      cancelled_at: null,
      attempts: 0,
      last_error: null,
    })),
    { onConflict: 'activity_id,kind' },
  );

  return error ? 0 : planos.length;
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const profile = await supabase
    .from('profiles')
    .select('id, organization_id')
    .eq('id', user.id)
    .single();
  if (profile.error || !profile.data?.organization_id) {
    return NextResponse.json({ error: 'Perfil sem empresa' }, { status: 404 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 422 });
  }
  const body = parsed.data;

  // O RLS já limita a consulta à empresa da sessão: se não achar, não é dela.
  const form = await supabase
    .from('forms')
    .select('id, name, active')
    .eq('id', body.formId)
    .maybeSingle();
  if (form.error || !form.data) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 });
  }
  if (!form.data.active) {
    return NextResponse.json({ error: 'Formulário desativado' }, { status: 409 });
  }

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + body.expiresInHours * 3600_000).toISOString();

  const link = await supabase
    .from('form_links')
    .insert({
      organization_id: profile.data.organization_id,
      form_id: body.formId,
      deal_id: body.dealId ?? null,
      activity_id: body.activityId ?? null,
      token_hash: tokenHash,
      recipient_label: body.recipientLabel ?? null,
      recipient_phone: body.recipientPhone ?? null,
      expires_at: expiresAt,
      created_by: profile.data.id,
    })
    .select('id, expires_at')
    .single();

  if (link.error || !link.data) {
    return NextResponse.json({ error: 'Não foi possível gerar o link' }, { status: 500 });
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/+$/, '');
  const url = `${base}/f/${token}`;

  let lembretes = 0;
  if (body.agendarLembretes && body.activityId && body.recipientPhone) {
    lembretes = await agendarLembretesDaVisita(supabase, {
      organizationId: profile.data.organization_id,
      activityId: body.activityId,
      dealId: body.dealId,
      formLinkId: link.data.id,
      formName: form.data.name,
      telefone: body.recipientPhone,
      url,
    });
  }

  return NextResponse.json({
    id: link.data.id,
    url,
    expiresAt: link.data.expires_at,
    formName: form.data.name,
    lembretes,
  });
}
