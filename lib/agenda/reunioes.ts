/**
 * @fileoverview Registro de reuniões vindas do n8n/IA na agenda da Alice.
 * Idempotente por `external_ref`: repetir o pedido atualiza a mesma reunião.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveBoardIdFromKey, resolveFirstStageId } from '@/lib/public-api/resolve'
import { advanceDealToRole } from '@/lib/agenda/stageRole'
import { paraE164 } from '@/lib/agenda/phone'

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
  startsAt: string
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

  const telefone = dados.phone ? paraE164(dados.phone) : null
  if (!telefone) {
    if (dados.phone) warnings.push('telefone_invalido')
    return vazio
  }

  const achado = await sb
    .from('contacts')
    .select('id, name')
    .eq('organization_id', organizationId)
    .eq('phone', telefone)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  let contactId = (achado.data?.id as string) || null
  let contactName = (achado.data?.name as string) || null

  if (!contactId) {
    const nome = dados.name?.trim() || 'Contato sem nome informado'
    const novo = await sb
      .from('contacts')
      .insert({
        organization_id: organizationId,
        name: nome,
        phone: telefone,
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

export async function registrarReuniao(
  sb: SupabaseClient,
  entrada: EntradaReuniao,
): Promise<ResultadoReuniao> {
  const { organizationId, externalRef } = entrada
  const inicio = new Date(toSaoPauloIso(entrada.startsAt))
  if (Number.isNaN(inicio.getTime())) throw new Error('Data da reunião inválida')
  const duracao =
    entrada.durationMinutes && entrada.durationMinutes > 0 ? entrada.durationMinutes : DURACAO_PADRAO_MIN
  const fim = entrada.endsAt
    ? new Date(toSaoPauloIso(entrada.endsAt))
    : new Date(inicio.getTime() + duracao * 60000)
  if (Number.isNaN(fim.getTime())) throw new Error('Data final da reunião inválida')

  const existente = await sb
    .from('activities')
    .select('id, deal_id, contact_id')
    .eq('organization_id', organizationId)
    .eq('external_ref', externalRef)
    .is('deleted_at', null)
    .maybeSingle()
  const existenteId = (existente.data?.id as string) || null

  // Atualização de situação (realizada / não compareceu): só troca o status.
  if (entrada.status && existenteId) {
    await sb
      .from('activities')
      .update({ meeting_status: entrada.status })
      .eq('organization_id', organizationId)
      .eq('id', existenteId)
    return {
      activityId: existenteId,
      dealId: (existente.data?.deal_id as string) || null,
      contactId: (existente.data?.contact_id as string) || null,
      reused: true,
      warnings: [],
    }
  }

  const warnings: string[] = []
  const negocio = await acharOuCriarNegocio(
    sb,
    organizationId,
    { dealId: entrada.dealId, phone: entrada.phone, name: entrada.name },
    warnings,
  )
  const titulo = `Reunião - ${negocio.contactName || entrada.name?.trim() || 'Contato'}`

  let activityId = existenteId
  if (existenteId) {
    // Remarcação: acerta data, horário e detalhes; a situação não volta para "agendada".
    const ajuste: Record<string, unknown> = {
      title: titulo,
      date: inicio.toISOString(),
      ends_at: fim.toISOString(),
    }
    if (negocio.dealId) ajuste.deal_id = negocio.dealId
    if (negocio.contactId) ajuste.contact_id = negocio.contactId
    if (entrada.format) ajuste.meeting_format = entrada.format
    if (entrada.meetingUrl) ajuste.meeting_url = entrada.meetingUrl
    if (entrada.address) ajuste.address = entrada.address
    if (entrada.description) ajuste.description = entrada.description
    if (entrada.origem) ajuste.source = entrada.origem
    await sb.from('activities').update(ajuste).eq('organization_id', organizationId).eq('id', existenteId)
  } else {
    const criada = await sb
      .from('activities')
      .insert({
        organization_id: organizationId,
        title: titulo,
        type: 'MEETING',
        date: inicio.toISOString(),
        ends_at: fim.toISOString(),
        completed: false,
        deal_id: negocio.dealId,
        contact_id: negocio.contactId,
        external_ref: externalRef,
        meeting_status: entrada.status ?? 'agendada',
        meeting_format: entrada.format ?? null,
        meeting_url: entrada.meetingUrl ?? null,
        address: entrada.address ?? null,
        description: entrada.description ?? null,
        source: entrada.origem ?? 'ia',
      })
      .select('id')
      .single()
    if (criada.error || !criada.data) throw new Error('Não foi possível criar a reunião')
    activityId = criada.data.id as string
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
    activityId: activityId as string,
    dealId: negocio.dealId,
    contactId: negocio.contactId,
    reused: Boolean(existenteId),
    warnings,
  }
}

/** Marca a reunião como cancelada (não apaga, não move o negócio). */
export async function cancelarReuniao(
  sb: SupabaseClient,
  dados: { organizationId: string; externalRef: string },
): Promise<string | null> {
  const existente = await sb
    .from('activities')
    .select('id')
    .eq('organization_id', dados.organizationId)
    .eq('external_ref', dados.externalRef)
    .is('deleted_at', null)
    .maybeSingle()
  const id = (existente.data?.id as string) || null
  if (!id) return null
  await sb
    .from('activities')
    .update({ meeting_status: 'cancelada' })
    .eq('organization_id', dados.organizationId)
    .eq('id', id)
  return id
}
