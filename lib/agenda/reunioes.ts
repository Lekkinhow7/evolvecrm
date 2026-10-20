/**
 * @fileoverview Registro de reuniões vindas do n8n/IA na agenda da Alice.
 * Idempotente por `external_ref`: repetir o pedido atualiza a mesma reunião.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveBoardIdFromKey, resolveFirstStageId } from '@/lib/public-api/resolve'
import { advanceDealToRole } from '@/lib/agenda/stageRole'
import { e164Recebido, variantesE164 } from '@/lib/agenda/phone'

const DURACAO_PADRAO_MIN = 60

/** Texto sem fuso é horário de São Paulo (-03:00); com fuso, fica como veio. */
export function toSaoPauloIso(raw: string): string {
  let s = raw.trim().replace(' ', 'T')
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T00:00:00'
  if (/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) return s
  return `${s}-03:00`
}

export interface EntradaReuniao {
  organizationId: string
  phone?: string
  dealId?: string
  name?: string
  startsAt?: string
  endsAt?: string
  durationMinutes?: number
  externalRef: string
  format?: 'online' | 'presencial'
  meetingUrl?: string
  address?: string
  description?: string
  origem?: 'ia' | 'equipe'
  status?: 'realizada' | 'nao_compareceu'
}

/** Pedido de mudar a situação de uma reunião que o CRM não conhece. */
export class ReuniaoNaoEncontrada extends Error {
  constructor() {
    super('Reunião não encontrada')
    this.name = 'ReuniaoNaoEncontrada'
  }
}

export interface ResultadoReuniao {
  activityId: string
  dealId: string | null
  contactId: string | null
  reused: boolean
  warnings: string[]
}

interface Negocio {
  dealId: string | null
  contactId: string | null
  contactName: string | null
}

async function acharOuCriarNegocio(
  sb: SupabaseClient,
  organizationId: string,
  dados: { dealId?: string; phone?: string; name?: string },
  warnings: string[],
): Promise<Negocio> {
  const vazio: Negocio = { dealId: null, contactId: null, contactName: null }

  if (dados.dealId) {
    const { data } = await sb
      .from('deals')
      .select('id, contact_id')
      .eq('organization_id', organizationId)
      .eq('id', dados.dealId)
      .is('deleted_at', null)
      .maybeSingle()
    if (data) {
      const contactId = (data.contact_id as string) || null
      let contactName: string | null = null
      if (contactId) {
        const c = await sb
          .from('contacts')
          .select('name')
          .eq('organization_id', organizationId)
          .eq('id', contactId)
          .maybeSingle()
        contactName = (c.data?.name as string) || null
      }
      return { dealId: data.id as string, contactId, contactName }
    }
    warnings.push('negocio_nao_encontrado')
  }

  const variantes = dados.phone ? variantesE164(dados.phone) : []
  const telefoneNovo = dados.phone ? e164Recebido(dados.phone) : null
  if (!variantes.length || !telefoneNovo) {
    if (dados.phone) warnings.push('telefone_invalido')
    return vazio
  }

  const achado = await sb
    .from('contacts')
    .select('id, name')
    .eq('organization_id', organizationId)
    .in('phone', variantes)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (achado.error) throw achado.error
  let contactId = (achado.data?.id as string) || null
  let contactName = (achado.data?.name as string) || null

  if (!contactId) {
    const nome = dados.name?.trim() || 'Contato sem nome informado'
    const novo = await sb
      .from('contacts')
      .insert({
        organization_id: organizationId,
        name: nome,
        phone: telefoneNovo,
        source: 'whatsapp',
        status: 'ACTIVE',
        stage: 'LEAD',
      })
      .select('id')
      .single()
    contactId = (novo.data?.id as string) || null
    contactName = nome
  }
  if (!contactId) {
    warnings.push('falha_ao_criar_contato')
    return vazio
  }

  const aberto = await sb
    .from('deals')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('contact_id', contactId)
    .eq('is_won', false)
    .eq('is_lost', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (aberto.error) throw aberto.error
  if (aberto.data) return { dealId: aberto.data.id as string, contactId, contactName }

  const boardKey = process.env.SITE_LEAD_BOARD_KEY || 'alice'
  const boardId = await resolveBoardIdFromKey({ organizationId, boardKey })
  const stageId = boardId ? await resolveFirstStageId({ organizationId, boardId }) : null
  if (!boardId || !stageId) {
    warnings.push('funil_nao_encontrado')
    return { dealId: null, contactId, contactName }
  }

  const agora = new Date().toISOString()
  const negocio = await sb
    .from('deals')
    .insert({
      organization_id: organizationId,
      title: contactName || 'Lead do WhatsApp',
      value: 0,
      board_id: boardId,
      stage_id: stageId,
      contact_id: contactId,
      is_won: false,
      is_lost: false,
      created_at: agora,
      updated_at: agora,
    })
    .select('id')
    .single()
  const dealId = (negocio.data?.id as string) || null
  if (!dealId) warnings.push('falha_ao_criar_negocio')
  return { dealId, contactId, contactName }
}

interface Existente {
  id: string
  dealId: string | null
  contactId: string | null
  meetingStatus: string | null
  date: string | null
}

async function buscarPorExternalRef(
  sb: SupabaseClient,
  organizationId: string,
  externalRef: string,
): Promise<Existente | null> {
  const { data, error } = await sb
    .from('activities')
    .select('id, deal_id, contact_id, meeting_status, date')
    .eq('organization_id', organizationId)
    .eq('external_ref', externalRef)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id as string,
    dealId: (data.deal_id as string) || null,
    contactId: (data.contact_id as string) || null,
    meetingStatus: (data.meeting_status as string) || null,
    date: (data.date as string) || null,
  }
}

/** Situação final (cancelada, realizada, não compareceu) fecha a atividade; "agendada" reabre. */
export function completedDaSituacao(status: string): boolean {
  return status !== 'agendada'
}

/** Negócio e contato que a reunião já tem, sem buscar por telefone nem criar nada. */
async function negocioDaReuniao(sb: SupabaseClient, organizationId: string, existente: Existente): Promise<Negocio> {
  let contactName: string | null = null
  if (existente.contactId) {
    const c = await sb
      .from('contacts')
      .select('name')
      .eq('organization_id', organizationId)
      .eq('id', existente.contactId)
      .maybeSingle()
    contactName = (c.data?.name as string) || null
  }
  return { dealId: existente.dealId, contactId: existente.contactId, contactName }
}

export async function registrarReuniao(
  sb: SupabaseClient,
  entrada: EntradaReuniao,
): Promise<ResultadoReuniao> {
  const { organizationId, externalRef } = entrada
  const semData = !entrada.startsAt
  const inicio = new Date(toSaoPauloIso(entrada.startsAt ?? ''))
  if (!(semData && entrada.status) && Number.isNaN(inicio.getTime())) throw new Error('Data da reunião inválida')
  const duracao =
    entrada.durationMinutes && entrada.durationMinutes > 0 ? entrada.durationMinutes : DURACAO_PADRAO_MIN
  const fim = entrada.endsAt
    ? new Date(toSaoPauloIso(entrada.endsAt))
    : new Date(inicio.getTime() + duracao * 60000)
  if (!(semData && entrada.status) && Number.isNaN(fim.getTime())) throw new Error('Data final da reunião inválida')

  let existente = await buscarPorExternalRef(sb, organizationId, externalRef)

  // Atualização de situação (realizada / não compareceu): só troca o status.
  if (entrada.status && existente) {
    const { error } = await sb
      .from('activities')
      .update({ meeting_status: entrada.status, completed: completedDaSituacao(entrada.status) })
      .eq('organization_id', organizationId)
      .eq('id', existente.id)
    if (error) throw error
    return {
      activityId: existente.id,
      dealId: existente.dealId,
      contactId: existente.contactId,
      reused: true,
      warnings: [],
    }
  }

  // Só mudar a situação de uma reunião que não existe: não cria nada.
  if (entrada.status && (!entrada.startsAt || !(entrada.phone || entrada.dealId))) {
    throw new ReuniaoNaoEncontrada()
  }

  const warnings: string[] = []
  // Reunião que já está num negócio continua nele, a menos que o pedido diga outro negócio.
  const negocio =
    existente?.dealId && !entrada.dealId
      ? await negocioDaReuniao(sb, organizationId, existente)
      : await acharOuCriarNegocio(
          sb,
          organizationId,
          { dealId: entrada.dealId, phone: entrada.phone, name: entrada.name },
          warnings,
        )
  const titulo = `Reunião - ${negocio.contactName || entrada.name?.trim() || 'Contato'}`

  // Remarcação: acerta data, horário e detalhes. Data nova numa reunião não
  // cancelada volta a ser "agendada" e reabre a atividade.
  const remarcar = async (atual: Existente) => {
    const ajuste: Record<string, unknown> = {
      title: titulo,
      date: inicio.toISOString(),
      ends_at: fim.toISOString(),
    }
    const dataAnterior = atual.date ? new Date(atual.date).getTime() : Number.NaN
    if (dataAnterior !== inicio.getTime() && atual.meetingStatus !== 'cancelada') {
      ajuste.meeting_status = 'agendada'
      ajuste.completed = false
    }
    if (negocio.dealId) ajuste.deal_id = negocio.dealId
    if (negocio.contactId) ajuste.contact_id = negocio.contactId
    if (entrada.format) ajuste.meeting_format = entrada.format
    if (entrada.meetingUrl) ajuste.meeting_url = entrada.meetingUrl
    if (entrada.address) ajuste.address = entrada.address
    if (entrada.description) ajuste.description = entrada.description
    if (entrada.origem) ajuste.source = entrada.origem
    const { error } = await sb
      .from('activities')
      .update(ajuste)
      .eq('organization_id', organizationId)
      .eq('id', atual.id)
    if (error) throw error
  }

  let activityId: string
  if (existente) {
    await remarcar(existente)
    activityId = existente.id
  } else {
    const status = entrada.status ?? 'agendada'
    const criada = await sb
      .from('activities')
      .insert({
        organization_id: organizationId,
        title: titulo,
        type: 'MEETING',
        date: inicio.toISOString(),
        ends_at: fim.toISOString(),
        completed: completedDaSituacao(status),
        deal_id: negocio.dealId,
        contact_id: negocio.contactId,
        external_ref: externalRef,
        meeting_status: status,
        meeting_format: entrada.format ?? null,
        meeting_url: entrada.meetingUrl ?? null,
        address: entrada.address ?? null,
        description: entrada.description ?? null,
        source: entrada.origem ?? 'ia',
      })
      .select('id')
      .single()
    if ((criada.error as { code?: string } | null)?.code === '23505') {
      // Outro pedido com o mesmo external_ref gravou primeiro: relê e atualiza.
      existente = await buscarPorExternalRef(sb, organizationId, externalRef)
      if (!existente) throw new Error('Não foi possível criar a reunião')
      await remarcar(existente)
      activityId = existente.id
    } else {
      if (criada.error || !criada.data) throw new Error('Não foi possível criar a reunião')
      activityId = criada.data.id as string
    }
  }

  if (negocio.dealId) {
    try {
      const r = await advanceDealToRole(sb, {
        organizationId,
        dealId: negocio.dealId,
        role: 'reuniao_agendada',
      })
      if (r.warning) warnings.push(r.warning)
    } catch {
      warnings.push('falha_ao_mover')
    }
  }

  return {
    activityId,
    dealId: negocio.dealId,
    contactId: negocio.contactId,
    reused: Boolean(existente),
    warnings,
  }
}

/** Marca a reunião como cancelada (não apaga, não move o negócio). */
export async function cancelarReuniao(
  sb: SupabaseClient,
  dados: { organizationId: string; externalRef: string },
): Promise<string | null> {
  const existente = await buscarPorExternalRef(sb, dados.organizationId, dados.externalRef)
  if (!existente) return null
  const { error } = await sb
    .from('activities')
    .update({ meeting_status: 'cancelada', completed: true })
    .eq('organization_id', dados.organizationId)
    .eq('id', existente.id)
  if (error) throw error
  return existente.id
}
