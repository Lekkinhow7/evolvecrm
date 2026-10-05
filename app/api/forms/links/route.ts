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
  })
  .refine((v) => Boolean(v.dealId || v.activityId), {
    message: 'Informe o negócio ou a visita',
  });

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

  return NextResponse.json({
    id: link.data.id,
    url: `${base}/f/${token}`,
    expiresAt: link.data.expires_at,
    formName: form.data.name,
  });
}
