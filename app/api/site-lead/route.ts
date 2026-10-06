import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createStaticAdminClient } from '@/lib/supabase/server';
import { isE164 } from '@/lib/phone';
import { normalizePhone, normalizeText } from '@/lib/public-api/sanitize';

/**
 * Captura de leads do site (formulário e botões de WhatsApp).
 *
 * `POST /api/site-lead` sem chave: o navegador do visitante chama direto, então
 * nenhum segredo pode ir para o site. A rota só cria/atualiza contato, abre um
 * negócio na primeira etapa do funil configurado e registra uma nota.
 *
 * Aceita `application/json` e `text/plain` (navigator.sendBeacon manda text/plain,
 * que não dispara preflight de CORS).
 *
 * Variáveis opcionais:
 * - SITE_LEAD_BOARD_KEY: chave do funil (padrão `succaozero`)
 * - SITE_LEAD_ALLOWED_ORIGINS: origens aceitas, separadas por vírgula (vazio = qualquer origem)
 */

export const runtime = 'nodejs';

const LeadSchema = z.object({
  name: z.string().max(120).optional(),
  phone: z.string().min(8).max(30),
  origem: z.enum(['formulario', 'whatsapp']).optional(),
  botao: z.string().max(60).optional(),
  tipo: z.string().max(60).optional(),
  ralos: z.string().max(30).optional(),
  notificacao: z.string().max(10).optional(),
  cidade: z.string().max(120).optional(),
  pagina: z.string().max(300).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(150).optional(),
  utm_content: z.string().max(150).optional(),
  utm_term: z.string().max(150).optional(),
  // Rastreio do anúncio: o mesmo event_id vai ao pixel, para a conversão não contar duas vezes.
  event_id: z.string().max(80).optional(),
  fbclid: z.string().max(300).optional(),
  gclid: z.string().max(300).optional(),
  fbp: z.string().max(120).optional(),
  fbc: z.string().max(400).optional(),
  // campo armadilha: humano não preenche
  website: z.string().max(200).optional(),
});

function allowedOrigin(request: Request): string {
  const origin = request.headers.get('origin') || '';
  const list = (process.env.SITE_LEAD_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return origin || '*';
  return list.includes(origin) ? origin : '';
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = allowedOrigin(request);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function reply(request: Request, status: number, body: unknown) {
  return NextResponse.json(body, { status, headers: corsHeaders(request) });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: Request) {
  if (!allowedOrigin(request)) return reply(request, 403, { ok: false, error: 'Origem não permitida' });

  const raw = await request.text().catch(() => '');
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(request, 400, { ok: false, error: 'JSON inválido' });
  }

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) return reply(request, 422, { ok: false, error: 'Dados inválidos' });
  const d = parsed.data;

  // Robô preencheu o campo escondido: responde ok e não grava nada.
  if (d.website && d.website.trim()) return reply(request, 200, { ok: true });

  const phone = normalizePhone(d.phone);
  if (!phone || !isE164(phone)) return reply(request, 422, { ok: false, error: 'Telefone inválido' });

  const name = normalizeText(d.name) || 'Lead do site';
  const origem = d.origem || 'formulario';
  const sb = createStaticAdminClient();

  const boardKey = process.env.SITE_LEAD_BOARD_KEY || 'succaozero';
  const board = await sb
    .from('boards')
    .select('id, organization_id')
    .eq('key', boardKey)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();
  if (board.error || !board.data) {
    console.error('[site-lead] funil não encontrado', boardKey, board.error);
    return reply(request, 500, { ok: false, error: 'Funil não configurado' });
  }
  const organizationId = board.data.organization_id as string;
  const boardId = board.data.id as string;

  const stage = await sb
    .from('board_stages')
    .select('id')
    .eq('board_id', boardId)
    .order('order', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (stage.error || !stage.data) {
    console.error('[site-lead] etapa inicial não encontrada', stage.error);
    return reply(request, 500, { ok: false, error: 'Funil sem etapas' });
  }

  const now = new Date().toISOString();

  // Guardado para mandar a conversão pela API da Meta e do Google mais tarde,
  // casando com o evento que o navegador já mandou (mesmo event_id).
  const rastreio = {
    event_id: normalizeText(d.event_id),
    fbclid: normalizeText(d.fbclid),
    gclid: normalizeText(d.gclid),
    fbp: normalizeText(d.fbp),
    fbc: normalizeText(d.fbc),
    ip: (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null,
    user_agent: (request.headers.get('user-agent') || '').slice(0, 300) || null,
    evento_em: now,
  };

  // 1) Contato: um por telefone
  const existingContact = await sb
    .from('contacts')
    .select('id, name')
    .eq('organization_id', organizationId)
    .eq('phone', phone)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();
  if (existingContact.error) {
    console.error('[site-lead] erro ao buscar contato', existingContact.error);
    return reply(request, 500, { ok: false, error: 'Erro ao gravar' });
  }

  let contactId: string;
  if (existingContact.data?.id) {
    contactId = existingContact.data.id as string;
    const patch: Record<string, unknown> = { updated_at: now, last_interaction: now };
    if (normalizeText(d.name) && existingContact.data.name === 'Lead do site') patch.name = name;
    await sb.from('contacts').update(patch).eq('id', contactId);
  } else {
    const created = await sb
      .from('contacts')
      .insert({
        organization_id: organizationId,
        name,
        phone,
        source: 'Site',
        status: 'ACTIVE',
        stage: 'LEAD',
        last_interaction: now,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();
    if (created.error) {
      console.error('[site-lead] erro ao criar contato', created.error);
      return reply(request, 500, { ok: false, error: 'Erro ao gravar' });
    }
    contactId = created.data.id as string;
  }

  // 2) Negócio: só abre outro se o contato não tiver um em aberto neste funil
  const openDeal = await sb
    .from('deals')
    .select('id')
    .eq('board_id', boardId)
    .eq('contact_id', contactId)
    .eq('is_won', false)
    .eq('is_lost', false)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();
  if (openDeal.error) {
    console.error('[site-lead] erro ao buscar negócio', openDeal.error);
    return reply(request, 500, { ok: false, error: 'Erro ao gravar' });
  }

  let dealId: string;
  let dealCreated = false;
  if (openDeal.data?.id) {
    dealId = openDeal.data.id as string;
  } else {
    const tipo = normalizeText(d.tipo);
    const created = await sb
      .from('deals')
      .insert({
        organization_id: organizationId,
        title: tipo ? `${name} (${tipo})` : name,
        value: 0,
        board_id: boardId,
        stage_id: stage.data.id,
        contact_id: contactId,
        tags: ['site', origem],
        custom_fields: {
          origem_site: origem,
          tipo_piscina: tipo,
          ralos: normalizeText(d.ralos),
          notificacao: normalizeText(d.notificacao),
          cidade: normalizeText(d.cidade),
          utm_source: normalizeText(d.utm_source),
          utm_medium: normalizeText(d.utm_medium),
          utm_campaign: normalizeText(d.utm_campaign),
          utm_content: normalizeText(d.utm_content),
          utm_term: normalizeText(d.utm_term),
          rastreio: rastreio,
        },
        is_won: false,
        is_lost: false,
        last_stage_change_date: now,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();
    if (created.error) {
      console.error('[site-lead] erro ao criar negócio', created.error);
      return reply(request, 500, { ok: false, error: 'Erro ao gravar' });
    }
    dealId = created.data.id as string;
    dealCreated = true;
  }

  // 3) Nota com o que a pessoa informou no site
  const linhas = [
    origem === 'whatsapp' ? `Clicou no botão de WhatsApp do site${d.botao ? ` (${d.botao})` : ''}.` : 'Preencheu o formulário de orçamento do site.',
    d.tipo ? `Tipo de piscina: ${d.tipo}` : null,
    d.ralos ? `Ralos no fundo: ${d.ralos}` : null,
    d.notificacao ? `Já recebeu notificação: ${d.notificacao}` : null,
    d.cidade ? `Local: ${d.cidade}` : null,
    d.utm_source || d.utm_campaign ? `Campanha: ${[d.utm_source, d.utm_medium, d.utm_campaign, d.utm_content, d.utm_term].filter(Boolean).join(' / ')}` : null,
    d.fbclid || d.fbc ? 'Veio de anúncio da Meta.' : null,
    d.gclid ? 'Veio de anúncio do Google.' : null,
    d.pagina ? `Página: ${d.pagina}` : null,
  ].filter(Boolean);

  const note = await sb.from('activities').insert({
    organization_id: organizationId,
    title: origem === 'whatsapp' ? 'Lead do site: WhatsApp' : 'Lead do site: formulário',
    description: linhas.join('\n'),
    type: 'NOTE',
    date: now,
    completed: true,
    deal_id: dealId,
    contact_id: contactId,
    created_at: now,
  });
  if (note.error) console.error('[site-lead] erro ao criar nota', note.error);

  return reply(request, dealCreated ? 201 : 200, {
    ok: true,
    contact_id: contactId,
    deal_id: dealId,
    deal_created: dealCreated,
  });
}
