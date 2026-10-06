/**
 * @fileoverview Agendamento de visita técnica ponta a ponta.
 *
 * Recebe o agendamento vindo do atendimento da IA e faz tudo de uma vez: acha
 * ou cria o contato e o negócio, escolhe o técnico da equipe, cria a visita no
 * calendário com o técnico que a IA escolheu, gera o link do laudo e deixa os
 * dois lembretes na fila. Ninguém precisa clicar em nada.
 *
 * O técnico, a disponibilidade e os slots moram no banco do agente: o CRM não
 * escolhe ninguém, só recebe quem vai e para qual WhatsApp mandar.
 *
 * @module lib/visits/agendar
 */

import { createHash, randomBytes } from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

const FUSO = 'America/Sao_Paulo';
const DURACAO_PADRAO_MIN = 60;
const VALIDADE_LINK_HORAS = 72;

/** Deixa o número no formato do WhatsApp: com 55 e com o nono dígito. */
export function normalizarTelefone(bruto: string): string | null {
  const digitos = (bruto || '').replace(/\D/g, '');
  if (!digitos) return null;
  const comPais = digitos.startsWith('55') ? digitos : `55${digitos}`;
  const corpo = comPais.slice(2);
  if (corpo.length === 10 && /^[6-9]/.test(corpo.slice(2, 3))) {
    return `55${corpo.slice(0, 2)}9${corpo.slice(2)}`;
  }
  if (corpo.length < 10 || corpo.length > 11) return null;
  return comPais;
}

/** Telefone no formato que o CRM guarda no contato. */
function paraE164(bruto: string): string | null {
  const n = normalizarTelefone(bruto);
  return n ? `+${n}` : null;
}

export interface EntradaAgendamento {
  organizationId: string;
  /** Telefone do cliente, de qualquer formato. */
  phone?: string | null;
  name?: string | null;
  /** Negócio já conhecido. Quando não vem, procura pelo telefone. */
  dealId?: string | null;
  startsAt: string;
  endsAt?: string | null;
  durationMinutes?: number | null;
  address?: string | null;
  addressNote?: string | null;
  /** Técnico escolhido pela IA no banco do agente. */
  technician?: { name: string; phone: string; ref?: string | null } | null;
  title?: string | null;
  /** Id do agendamento no sistema de origem, para não duplicar. */
  externalRef?: string | null;
  /** Endereço base do CRM, para montar o link do formulário. */
  appUrl: string;
  /**
   * Quando o aviso ao técnico é mandado pelo n8n, o CRM não põe nada na fila
   * dele: só cria a visita e devolve o link.
   */
  programarLembretes?: boolean;
  /** Gera um link novo a cada pedido: o aviso de 2h e o de 15min levam links próprios. */
  novoLink?: boolean;
  /** Chave do formulário cujo link volta: laudo_visita (padrão), orcamento ou venda. */
  formulario?: string;
}

export interface ResultadoAgendamento {
  activityId: string;
  dealId: string | null;
  contactId: string | null;
  technician: { name: string; phone: string; ref: string | null } | null;
  formUrl: string | null;
  reminders: number;
  reused: boolean;
}

/** Acha o negócio aberto do cliente, ou cria contato e negócio. */
async function acharOuCriarNegocio(
  supabase: SupabaseClient,
  organizationId: string,
  dados: { dealId?: string | null; phone?: string | null; name?: string | null },
): Promise<{ dealId: string | null; contactId: string | null; boardId: string | null }> {
  if (dados.dealId) {
    const d = await supabase
      .from('deals')
      .select('id, contact_id, board_id')
      .eq('id', dados.dealId)
      .eq('organization_id', organizationId)
      .maybeSingle();
    if (d.data) {
      return { dealId: d.data.id as string, contactId: (d.data.contact_id as string) || null, boardId: (d.data.board_id as string) || null };
    }
  }

  const telefone = dados.phone ? paraE164(dados.phone) : null;
  if (!telefone) return { dealId: null, contactId: null, boardId: null };

  let contactId: string | null = null;
  const contato = await supabase
    .from('contacts')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('phone', telefone)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  contactId = (contato.data?.id as string) || null;

  if (!contactId) {
    const novo = await supabase
      .from('contacts')
      .insert({ organization_id: organizationId, name: dados.name?.trim() || 'Contato sem nome informado', phone: telefone, source: 'whatsapp' })
      .select('id')
      .single();
    contactId = (novo.data?.id as string) || null;
  }
  if (!contactId) return { dealId: null, contactId: null, boardId: null };

  const aberto = await supabase
    .from('deals')
    .select('id, board_id')
    .eq('organization_id', organizationId)
    .eq('contact_id', contactId)
    .eq('is_won', false)
    .eq('is_lost', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (aberto.data) {
    return { dealId: aberto.data.id as string, contactId, boardId: (aberto.data.board_id as string) || null };
  }

  const board = await supabase
    .from('boards')
    .select('id')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle();
  const boardId = (board.data?.id as string) || null;
  if (!boardId) return { dealId: null, contactId, boardId: null };

  const etapa = await supabase
    .from('board_stages')
    .select('id')
    .eq('board_id', boardId)
    .order('order', { ascending: true })
    .limit(1)
    .maybeSingle();

  const negocio = await supabase
    .from('deals')
    .insert({
      organization_id: organizationId,
      title: dados.name?.trim() || 'Lead do WhatsApp',
      board_id: boardId,
      stage_id: etapa.data?.id ?? null,
      contact_id: contactId,
      status: 'OPEN',
      last_stage_change_date: new Date().toISOString(),
    })
    .select('id')
    .single();

  return { dealId: (negocio.data?.id as string) || null, contactId, boardId };
}

/** Move o negócio para a etapa de visita agendada, se ela existir. */
async function marcarVisitaAgendada(supabase: SupabaseClient, dealId: string, boardId: string | null) {
  if (!boardId) return;
  const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const etapas = await supabase.from('board_stages').select('id, name').eq('board_id', boardId);
  const alvo = (etapas.data || []).find((e) => semAcento(String(e.name)) === 'visita agendada');
  if (!alvo) return;
  const atual = await supabase.from('deals').select('stage_id, is_won, is_lost').eq('id', dealId).maybeSingle();
  if (!atual.data || atual.data.is_won || atual.data.is_lost || atual.data.stage_id === alvo.id) return;
  await supabase
    .from('deals')
    .update({ stage_id: alvo.id, last_stage_change_date: new Date().toISOString() })
    .eq('id', dealId);
}

/**
 * Põe na fila os dois avisos da visita, com o link já dentro da mensagem.
 * Reagendar regrava os horários; horário que já passou não entra.
 */
export async function agendarLembretesDaVisita(
  supabase: SupabaseClient,
  dados: {
    organizationId: string;
    activityId: string;
    dealId?: string | null;
    formLinkId: string;
    telefone: string;
    url: string;
    titulo: string;
    quando: Date;
    endereco?: string | null;
    nomeTecnico?: string | null;
  },
): Promise<number> {
  const telefone = normalizarTelefone(dados.telefone);
  if (!telefone) return 0;

  const hora = dados.quando.toLocaleString('pt-BR', {
    timeZone: FUSO,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const nome = dados.nomeTecnico?.split(' ')[0] || '';

  const corpo = (abertura: string) =>
    [
      abertura,
      '',
      `Visita: ${dados.titulo}`,
      `Quando: ${hora}`,
      dados.endereco ? `Endereço: ${dados.endereco}` : null,
      '',
      'Formulário do laudo, para preencher no fim da visita:',
      dados.url,
    ]
      .filter((l): l is string => l !== null)
      .join('\n');

  const agora = Date.now();
  const planos = [
    {
      kind: 'visita_2h',
      scheduled_for: new Date(dados.quando.getTime() - 2 * 60 * 60 * 1000),
      body: corpo(`${nome ? `Oi, ${nome}! ` : 'Oi! '}Sua visita é daqui a duas horas.`),
    },
    {
      kind: 'visita_15min',
      scheduled_for: new Date(dados.quando.getTime() - 15 * 60 * 1000),
      body: corpo(
        `${nome ? `${nome}, ` : ''}faltam 15 minutos para a visita. Deixe este link aberto para preencher o laudo assim que terminar.`,
      ),
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

/**
 * Agenda a visita e deixa tudo pronto: calendário, técnico, link e lembretes.
 */
export async function agendarVisita(
  supabase: SupabaseClient,
  entrada: EntradaAgendamento,
): Promise<ResultadoAgendamento> {
  const inicio = new Date(entrada.startsAt);
  if (Number.isNaN(inicio.getTime())) throw new Error('Data da visita inválida');
  const duracao = entrada.durationMinutes && entrada.durationMinutes > 0 ? entrada.durationMinutes : DURACAO_PADRAO_MIN;
  const fim = entrada.endsAt ? new Date(entrada.endsAt) : new Date(inicio.getTime() + duracao * 60000);

  const negocio = await acharOuCriarNegocio(supabase, entrada.organizationId, {
    dealId: entrada.dealId,
    phone: entrada.phone,
    name: entrada.name,
  });

  const tecnico =
    entrada.technician?.name && entrada.technician?.phone
      ? { name: entrada.technician.name, phone: entrada.technician.phone, ref: entrada.technician.ref ?? null }
      : null;
  const titulo = entrada.title?.trim() || `Visita técnica${entrada.name ? ` - ${entrada.name}` : ''}`;

  // Mesmo agendamento chegando duas vezes atualiza a visita, não duplica.
  let activityId: string | null = null;
  let reaproveitada = false;
  if (entrada.externalRef) {
    const existente = await supabase
      .from('activities')
      .select('id')
      .eq('organization_id', entrada.organizationId)
      .eq('external_ref', entrada.externalRef)
      .is('deleted_at', null)
      .maybeSingle();
    activityId = (existente.data?.id as string) || null;
    reaproveitada = Boolean(activityId);
  }

  const campos = {
    organization_id: entrada.organizationId,
    title: titulo,
    type: 'VISITA',
    date: inicio.toISOString(),
    ends_at: fim.toISOString(),
    visit_status: 'agendada',
    deal_id: negocio.dealId,
    contact_id: negocio.contactId,
    address: entrada.address ?? null,
    address_note: entrada.addressNote ?? null,
    technician_ref: tecnico?.ref ?? null,
    technician_label: tecnico?.name ?? null,
    technician_phone: tecnico?.phone ?? null,
    external_ref: entrada.externalRef ?? null,
    completed: false,
  };

  if (activityId) {
    // Visita que já existe: só acerta data, horário e quem vai. Situação,
    // laudo e conclusão são do CRM e não voltam para "agendada" quando um
    // aviso depois da visita pede o link de novo.
    const ajuste: Record<string, unknown> = {
      title: titulo,
      date: inicio.toISOString(),
      ends_at: fim.toISOString(),
    };
    if (negocio.dealId) ajuste.deal_id = negocio.dealId;
    if (negocio.contactId) ajuste.contact_id = negocio.contactId;
    if (entrada.address) ajuste.address = entrada.address;
    if (entrada.addressNote) ajuste.address_note = entrada.addressNote;
    if (tecnico) {
      ajuste.technician_ref = tecnico.ref;
      ajuste.technician_label = tecnico.name;
      ajuste.technician_phone = tecnico.phone;
    }
    await supabase.from('activities').update(ajuste).eq('id', activityId);
  } else {
    const criada = await supabase.from('activities').insert(campos).select('id').single();
    if (criada.error || !criada.data) throw new Error('Não foi possível criar a visita');
    activityId = criada.data.id as string;
    // Só a visita nova move o cartão: depois dela o funil anda pelos formulários.
    if (negocio.dealId) await marcarVisitaAgendada(supabase, negocio.dealId, negocio.boardId);
  }

  // Link do formulário pedido (o laudo, se nada for dito).
  const formulario = await supabase
    .from('forms')
    .select('id')
    .eq('organization_id', entrada.organizationId)
    .eq('key', entrada.formulario || 'laudo_visita')
    .eq('active', true)
    .maybeSingle();

  let formUrl: string | null = null;
  let lembretes = 0;

  if (formulario.data?.id && tecnico) {
    const jaTem = await supabase
      .from('form_links')
      .select('id')
      .eq('activity_id', activityId)
      .eq('form_id', formulario.data.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    let linkId = entrada.novoLink ? null : ((jaTem.data?.id as string) || null);
    let token: string | null = null;

    if (!linkId) {
      token = randomBytes(32).toString('base64url');
      const novo = await supabase
        .from('form_links')
        .insert({
          organization_id: entrada.organizationId,
          form_id: formulario.data.id,
          activity_id: activityId,
          deal_id: negocio.dealId,
          token_hash: createHash('sha256').update(token).digest('hex'),
          recipient_label: tecnico.name,
          recipient_phone: tecnico.phone,
          expires_at: new Date(fim.getTime() + VALIDADE_LINK_HORAS * 3600_000).toISOString(),
        })
        .select('id')
        .single();
      linkId = (novo.data?.id as string) || null;
    }

    if (linkId && token) {
      formUrl = `${entrada.appUrl.replace(/\/+$/, '')}/f/${token}`;
      lembretes = entrada.programarLembretes === false ? 0 : await agendarLembretesDaVisita(supabase, {
        organizationId: entrada.organizationId,
        activityId,
        dealId: negocio.dealId,
        formLinkId: linkId,
        telefone: tecnico.phone,
        url: formUrl,
        titulo,
        quando: inicio,
        endereco: [entrada.address, entrada.addressNote].filter(Boolean).join(' - ') || null,
        nomeTecnico: tecnico.name,
      });
    } else if (linkId) {
      // Link já existia: só reacerta os horários dos avisos, mantendo a mensagem.
      await supabase
        .from('outbound_messages')
        .update({ scheduled_for: new Date(inicio.getTime() - 2 * 3600_000).toISOString() })
        .eq('activity_id', activityId)
        .eq('kind', 'visita_2h')
        .is('sent_at', null);
      await supabase
        .from('outbound_messages')
        .update({ scheduled_for: new Date(inicio.getTime() - 15 * 60_000).toISOString() })
        .eq('activity_id', activityId)
        .eq('kind', 'visita_15min')
        .is('sent_at', null);
    }
  }

  return {
    activityId,
    dealId: negocio.dealId,
    contactId: negocio.contactId,
    technician: tecnico,
    formUrl,
    reminders: lembretes,
    reused: reaproveitada,
  };
}
