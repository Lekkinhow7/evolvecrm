/**
 * @fileoverview Conversas do WhatsApp (uazapi) vindas do n8n.
 *
 * O número do WhatsApp fica conectado ao agente de IA no n8n. O n8n recebe cada
 * evento da uazapi e repassa uma cópia para cá, para a conversa aparecer no CRM:
 * - mensagem do cliente → entrada;
 * - resposta do agente (enviada pela API, sem marca do CRM) → saída da IA;
 * - mensagem digitada no celular do número → saída de um consultor.
 * O que o próprio CRM enviou (marca `track_source: 'crm'`) já está gravado e é ignorado.
 *
 * Quando um consultor fala com o cliente, o agente fica pausado naquele cliente por
 * 5 minutos desde a última mensagem do consultor. O n8n controla a pausa de verdade;
 * aqui só fica o espelho em `metadata.agente`, para a tela mostrar o estado.
 */

import { NextResponse } from 'next/server';

import { authPublicApi } from '@/lib/public-api/auth';
import { createStaticAdminClient } from '@/lib/supabase/server';
import { UAZAPI_TRACK_SOURCE_CRM } from '@/lib/messaging/providers/whatsapp/uazapi.provider';

export const runtime = 'nodejs';

const PAUSA_AGENTE_MS = 5 * 60 * 1000;

type UazapiMessage = {
  id?: string;
  messageid?: string;
  chatid?: string;
  sender_pn?: string;
  senderName?: string;
  fromMe?: boolean;
  isGroup?: boolean;
  wasSentByApi?: boolean;
  track_source?: string;
  messageType?: string;
  mediaType?: string;
  text?: string;
  content?: unknown;
  messageTimestamp?: number;
};

type UazapiChat = {
  wa_chatid?: string;
  wa_contactName?: string;
  wa_name?: string;
  name?: string;
  phone?: string;
};

const ROTULO_MIDIA: Record<string, string> = {
  image: 'Imagem',
  video: 'Vídeo',
  audio: 'Áudio',
  ptt: 'Áudio',
  myaudio: 'Áudio',
  document: 'Documento',
  sticker: 'Figurinha',
  location: 'Localização',
  contact: 'Contato',
};

function digitosDoChat(message: UazapiMessage, chat: UazapiChat): string {
  const candidatos = [chat.wa_chatid, message.chatid, message.sender_pn, chat.phone];
  for (const c of candidatos) {
    const s = String(c || '');
    if (!s || /@(g\.us|newsletter|lid)$/.test(s)) continue;
    const d = s.split('@')[0].replace(/\D/g, '');
    if (d.length >= 10) return d;
  }
  return '';
}

/** Variantes do telefone para casar com o contato do CRM (com e sem o nono dígito). */
function variantesTelefone(d: string): string[] {
  const v = new Set<string>([`+${d}`]);
  if (/^55\d{10}$/.test(d) && /^[6-9]/.test(d.slice(4))) v.add(`+${d.slice(0, 4)}9${d.slice(4)}`);
  if (/^55\d{11}$/.test(d) && d[4] === '9') v.add(`+${d.slice(0, 4)}${d.slice(5)}`);
  return [...v];
}

function textoDaMensagem(message: UazapiMessage): string {
  const tipo = String(message.mediaType || message.messageType || '').toLowerCase();
  const conteudo = (message.content && typeof message.content === 'object') ? message.content as Record<string, unknown> : null;
  const legenda = String(message.text || (typeof message.content === 'string' ? message.content : '') || conteudo?.caption || '').trim();
  const rotulo = Object.entries(ROTULO_MIDIA).find(([k]) => tipo.includes(k))?.[1];
  if (rotulo && !/conversation|extendedtext/.test(tipo)) return legenda ? `[${rotulo}] ${legenda}` : `[${rotulo}]`;
  return legenda || '[Mensagem sem texto]';
}

export async function POST(request: Request) {
  const auth = await authPublicApi(request);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const body = (await request.json().catch(() => null)) as
    | { EventType?: string; message?: UazapiMessage; chat?: UazapiChat; owner?: string }
    | null;
  if (!body) return NextResponse.json({ error: 'Corpo inválido', code: 'INVALID_BODY' }, { status: 422 });

  if (body.EventType && body.EventType !== 'messages') {
    return NextResponse.json({ ok: true, ignorado: 'evento' });
  }
  const message = body.message || {};
  const chat = body.chat || {};
  if (message.isGroup) return NextResponse.json({ ok: true, ignorado: 'grupo' });

  const fromMe = message.fromMe === true;
  if (fromMe && message.track_source === UAZAPI_TRACK_SOURCE_CRM) {
    // Enviada pelo próprio CRM: já está gravada na conversa.
    return NextResponse.json({ ok: true, ignorado: 'enviada_pelo_crm' });
  }

  const digitos = digitosDoChat(message, chat);
  if (!digitos) return NextResponse.json({ ok: true, ignorado: 'sem_telefone' });

  const externalId = String(message.messageid || message.id || '').trim() || null;
  const admin = createStaticAdminClient();

  const { data: canal } = await admin
    .from('messaging_channels')
    .select('id, business_unit_id, settings')
    .eq('organization_id', auth.organizationId)
    .eq('channel_type', 'whatsapp')
    .eq('provider', 'uazapi')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!canal) {
    return NextResponse.json({ error: 'Nenhum canal uazapi cadastrado no CRM', code: 'NO_CHANNEL' }, { status: 409 });
  }

  if (externalId) {
    const { data: existe } = await admin.from('messaging_messages').select('id').eq('external_id', externalId).maybeSingle();
    if (existe) return NextResponse.json({ ok: true, ignorado: 'repetida', message_id: existe.id });
  }

  // Contato do CRM pelo telefone (o mesmo que a sincronização do agente cria).
  const { data: contato } = await admin
    .from('contacts')
    .select('id, name')
    .eq('organization_id', auth.organizationId)
    .in('phone', variantesTelefone(digitos))
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nomeContato = String(chat.wa_contactName || chat.wa_name || chat.name || (!fromMe ? message.senderName : '') || '').trim() || null;

  let { data: conversa } = await admin
    .from('messaging_conversations')
    .select('id, contact_id, external_contact_name, metadata')
    .eq('channel_id', canal.id)
    .eq('external_contact_id', digitos)
    .maybeSingle();

  if (!conversa) {
    const criada = await admin
      .from('messaging_conversations')
      .insert({
        organization_id: auth.organizationId,
        channel_id: canal.id,
        business_unit_id: canal.business_unit_id,
        contact_id: contato?.id ?? null,
        external_contact_id: digitos,
        external_contact_name: contato?.name || nomeContato,
        status: 'open',
        metadata: {},
      })
      .select('id, contact_id, external_contact_name, metadata')
      .single();
    if (criada.error) {
      // Duas mensagens ao mesmo tempo: a outra criou a conversa primeiro.
      const de_novo = await admin
        .from('messaging_conversations')
        .select('id, contact_id, external_contact_name, metadata')
        .eq('channel_id', canal.id)
        .eq('external_contact_id', digitos)
        .maybeSingle();
      conversa = de_novo.data;
      if (!conversa) {
        console.error('[whatsapp] falha ao criar conversa', criada.error);
        return NextResponse.json({ error: 'Falha ao criar conversa', code: 'CONVERSATION_FAILED' }, { status: 500 });
      }
    } else {
      conversa = criada.data;
    }
  }

  const ajustes: Record<string, unknown> = {};
  if (!conversa.contact_id && contato?.id) ajustes.contact_id = contato.id;
  if (!conversa.external_contact_name && (contato?.name || nomeContato)) ajustes.external_contact_name = contato?.name || nomeContato;

  // Quem escreveu: cliente, agente de IA (pela API) ou consultor no celular do número.
  // Mesmo critério do n8n: sem o campo wasSentByApi, não conta como consultor.
  const consultorNoCelular = fromMe && message.wasSentByApi === false;
  const nomeAgente = String((canal.settings as Record<string, unknown> | null)?.agentName || 'Agente de IA');
  if (consultorNoCelular) {
    const meta = { ...((conversa.metadata as Record<string, unknown>) || {}) };
    const agente = { ...((meta.agente as Record<string, unknown>) || {}) };
    if (agente.modo !== 'pausado_sem_prazo') {
      agente.modo = 'pausado';
      agente.ate = new Date(Date.now() + PAUSA_AGENTE_MS).toISOString();
    }
    agente.ultimo_consultor_em = new Date().toISOString();
    meta.agente = agente;
    ajustes.metadata = meta;
  }
  if (Object.keys(ajustes).length) {
    await admin.from('messaging_conversations').update(ajustes).eq('id', conversa.id);
  }

  const quando = typeof message.messageTimestamp === 'number' && message.messageTimestamp > 0
    ? new Date(message.messageTimestamp > 1e12 ? message.messageTimestamp : message.messageTimestamp * 1000).toISOString()
    : new Date().toISOString();
  const texto = textoDaMensagem(message);

  const inserida = await admin
    .from('messaging_messages')
    .insert({
      conversation_id: conversa.id,
      external_id: externalId,
      direction: fromMe ? 'outbound' : 'inbound',
      content_type: 'text',
      content: { type: 'text', text: texto },
      status: fromMe ? 'sent' : 'delivered',
      sent_at: fromMe ? quando : null,
      delivered_at: fromMe ? null : quando,
      sender_type: fromMe ? (consultorNoCelular ? 'agent' : 'ai') : null,
      sender_name: fromMe ? (consultorNoCelular ? 'Consultor (celular)' : nomeAgente) : (contato?.name || nomeContato),
      metadata: { origem: 'uazapi', track_source: message.track_source || null, enviada_pela_api: message.wasSentByApi === true },
      created_at: quando,
    })
    .select('id')
    .single();

  if (inserida.error) {
    if (inserida.error.code === '23505') return NextResponse.json({ ok: true, ignorado: 'repetida' });
    console.error('[whatsapp] falha ao gravar mensagem', inserida.error);
    return NextResponse.json({ error: 'Falha ao gravar mensagem', code: 'MESSAGE_FAILED' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, conversation_id: conversa.id, message_id: inserida.data.id });
}
