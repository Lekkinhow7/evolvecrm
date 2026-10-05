/**
 * @fileoverview Formulário aberto por link assinado.
 *
 * Rota pública de propósito: o técnico abre no celular sem login. O acesso é
 * limitado pelo token, que vale para um registro só e tem validade. Nada aqui
 * confia em dado vindo do navegador além do próprio token.
 */

import { createHash } from 'node:crypto';

import { NextResponse } from 'next/server';

import { buildColumnUpdates } from '@/lib/forms/targets';
import { createStaticAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const BUCKET = 'deal-files';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 12;

interface LinkRow {
  id: string;
  organization_id: string;
  form_id: string;
  deal_id: string | null;
  activity_id: string | null;
  expires_at: string;
  used_at: string | null;
  recipient_label: string | null;
}

async function findLink(token: string) {
  const supabase = createStaticAdminClient();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const { data, error } = await supabase
    .from('form_links')
    .select('id, organization_id, form_id, deal_id, activity_id, expires_at, used_at, recipient_label')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error || !data) return { supabase, link: null as LinkRow | null, motivo: 'inexistente' as const };
  const link = data as LinkRow;
  if (new Date(link.expires_at).getTime() < Date.now()) {
    return { supabase, link: null, motivo: 'vencido' as const };
  }
  return { supabase, link, motivo: null };
}

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const { supabase, link, motivo } = await findLink(token);
  if (!link) {
    return NextResponse.json(
      { error: motivo === 'vencido' ? 'Este link venceu' : 'Link inválido' },
      { status: motivo === 'vencido' ? 410 : 404 },
    );
  }

  const form = await supabase
    .from('forms')
    .select('id, name, description, intro, thanks_message, target, active, form_fields(*)')
    .eq('id', link.form_id)
    .maybeSingle();
  if (form.error || !form.data || !form.data.active) {
    return NextResponse.json({ error: 'Formulário indisponível' }, { status: 404 });
  }

  let contexto: { titulo?: string; endereco?: string; quando?: string } = {};
  if (link.activity_id) {
    const visita = await supabase
      .from('activities')
      .select('title, address, address_note, date')
      .eq('id', link.activity_id)
      .maybeSingle();
    if (visita.data) {
      contexto = {
        titulo: visita.data.title as string,
        endereco: [visita.data.address, visita.data.address_note].filter(Boolean).join(' - ') || undefined,
        quando: visita.data.date as string,
      };
    }
  } else if (link.deal_id) {
    const negocio = await supabase.from('deals').select('title').eq('id', link.deal_id).maybeSingle();
    if (negocio.data) contexto = { titulo: negocio.data.title as string };
  }

  if (!link.used_at) {
    await supabase.from('form_links').update({ opened_at: new Date().toISOString() }).eq('id', link.id).is('opened_at', null);
  }

  const campos = ((form.data.form_fields as Array<Record<string, unknown>>) || [])
    .slice()
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((f) => ({
      key: f.key as string,
      label: f.label as string,
      helpText: (f.help_text as string) || undefined,
      type: f.type as string,
      options: (f.options as string[]) || undefined,
      required: Boolean(f.required),
    }));

  return NextResponse.json({
    form: {
      name: form.data.name,
      description: form.data.description,
      intro: form.data.intro,
      fields: campos,
    },
    contexto,
    destinatario: link.recipient_label,
    jaRespondido: Boolean(link.used_at),
  });
}

export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const { supabase, link, motivo } = await findLink(token);
  if (!link) {
    return NextResponse.json(
      { error: motivo === 'vencido' ? 'Este link venceu' : 'Link inválido' },
      { status: motivo === 'vencido' ? 410 : 404 },
    );
  }

  const form = await supabase
    .from('forms')
    .select('id, target, thanks_message, active, form_fields(key, label, type, required, target_column)')
    .eq('id', link.form_id)
    .maybeSingle();
  if (form.error || !form.data || !form.data.active) {
    return NextResponse.json({ error: 'Formulário indisponível' }, { status: 404 });
  }
  const campos = (form.data.form_fields as Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    target_column: string | null;
  }>) || [];

  let dados: FormData;
  try {
    dados = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Envio inválido' }, { status: 400 });
  }

  let respostas: Record<string, unknown> = {};
  try {
    respostas = JSON.parse(String(dados.get('answers') || '{}'));
  } catch {
    return NextResponse.json({ error: 'Respostas inválidas' }, { status: 422 });
  }
  const autor = String(dados.get('author') || '').trim().slice(0, 120) || link.recipient_label || null;

  const faltando = campos
    .filter((c) => c.required && c.type !== 'file')
    .filter((c) => {
      const v = respostas[c.key];
      return v === undefined || v === null || String(v).trim() === '';
    })
    .map((c) => c.label);
  if (faltando.length) {
    return NextResponse.json({ error: `Faltou preencher: ${faltando.join(', ')}` }, { status: 422 });
  }

  const arquivos: Array<{ name: string; path: string; size: number; fieldKey: string }> = [];
  const entradas = dados.getAll('files').filter((f): f is File => f instanceof File).slice(0, MAX_FILES);
  for (const arquivo of entradas) {
    if (arquivo.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `Arquivo muito grande: ${arquivo.name}` }, { status: 413 });
    }
    const limpo = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const caminho = `${link.organization_id}/formularios/${link.id}/${Date.now()}-${limpo}`;
    const envio = await supabase.storage
      .from(BUCKET)
      .upload(caminho, Buffer.from(await arquivo.arrayBuffer()), {
        contentType: arquivo.type || 'application/octet-stream',
        upsert: false,
      });
    if (envio.error) {
      return NextResponse.json({ error: 'Falha ao guardar o arquivo' }, { status: 500 });
    }
    arquivos.push({ name: arquivo.name, path: caminho, size: arquivo.size, fieldKey: 'anexos' });
  }

  const envio = await supabase
    .from('form_submissions')
    .insert({
      organization_id: link.organization_id,
      form_id: link.form_id,
      form_link_id: link.id,
      deal_id: link.deal_id,
      activity_id: link.activity_id,
      answers: respostas,
      files: arquivos,
      author_label: autor,
    })
    .select('id')
    .single();
  if (envio.error) {
    return NextResponse.json({ error: 'Não foi possível gravar' }, { status: 500 });
  }

  // Data da visita serve de base para transformar "14:30" em data e hora.
  let dataVisita: string | null = null;
  if (link.activity_id) {
    const visita = await supabase.from('activities').select('date').eq('id', link.activity_id).maybeSingle();
    dataVisita = (visita.data?.date as string) || null;
  }

  const updates = buildColumnUpdates(
    campos.map((c) => ({ key: c.key, targetColumn: c.target_column })),
    respostas,
    dataVisita,
  );

  if (link.activity_id) {
    const patch: Record<string, unknown> = { ...updates.activity, report_filled_at: new Date().toISOString() };
    if (!patch.visit_status) patch.visit_status = 'concluida';
    patch.completed = true;
    await supabase.from('activities').update(patch).eq('id', link.activity_id);
  }
  if (link.deal_id && Object.keys(updates.deal).length) {
    await supabase.from('deals').update(updates.deal).eq('id', link.deal_id);
  }

  await supabase.from('form_links').update({ used_at: new Date().toISOString() }).eq('id', link.id);

  return NextResponse.json({
    ok: true,
    mensagem: form.data.thanks_message || 'Recebido. Pode fechar esta página.',
  });
}
