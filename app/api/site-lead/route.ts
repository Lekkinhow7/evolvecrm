import { createHash } from 'node:crypto'

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { isE164 } from '@/lib/phone'
import { normalizePhone, normalizeText } from '@/lib/public-api/sanitize'
import { getSuccaozeroConfig } from '@/lib/succaozero/config'
import { ingestSuccaozeroLead } from '@/lib/succaozero/intake'
import { createStaticAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

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
  website: z.string().max(200).optional(),
})

type SiteLead = z.infer<typeof LeadSchema>

function allowedOrigin(request: Request): string {
  const origin = request.headers.get('origin') || ''
  const list = (process.env.SITE_LEAD_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (list.length === 0) return origin || '*'
  return list.includes(origin) ? origin : ''
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = allowedOrigin(request)
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  if (origin) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

function reply(request: Request, status: number, body: unknown) {
  return NextResponse.json(body, { status, headers: corsHeaders(request) })
}

function createSiteEventId(data: SiteLead): string {
  const window = Math.floor(Date.now() / (5 * 60 * 1000))
  const fingerprint = JSON.stringify({
    window,
    name: normalizeText(data.name),
    phone: normalizePhone(data.phone),
    origem: data.origem || 'formulario',
    pagina: normalizeText(data.pagina),
    utm_source: normalizeText(data.utm_source),
    utm_medium: normalizeText(data.utm_medium),
    utm_campaign: normalizeText(data.utm_campaign),
  })
  return `site:${createHash('sha256').update(fingerprint).digest('hex')}`
}

function metadata(data: SiteLead) {
  return {
    origem: data.origem || 'formulario',
    botao: normalizeText(data.botao),
    tipo_piscina: normalizeText(data.tipo),
    ralos: normalizeText(data.ralos),
    notificacao: normalizeText(data.notificacao),
    cidade: normalizeText(data.cidade),
    pagina: normalizeText(data.pagina),
    utm_source: normalizeText(data.utm_source),
    utm_medium: normalizeText(data.utm_medium),
    utm_campaign: normalizeText(data.utm_campaign),
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) })
}

export async function POST(request: Request) {
  if (!allowedOrigin(request)) {
    return reply(request, 403, { ok: false, error: 'Origem não permitida' })
  }

  const raw = await request.text().catch(() => '')
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return reply(request, 400, { ok: false, error: 'JSON inválido' })
  }

  const parsed = LeadSchema.safeParse(body)
  if (!parsed.success) {
    return reply(request, 422, { ok: false, error: 'Dados inválidos' })
  }
  const data = parsed.data

  if (data.website?.trim()) return reply(request, 200, { ok: true })

  let config
  try {
    config = getSuccaozeroConfig()
  } catch (error) {
    console.error('[site-lead] configuração canônica inválida', error)
    return reply(request, 503, {
      ok: false,
      error: 'Entrada temporariamente indisponível',
    })
  }
  if (!config.enabled) {
    return reply(request, 503, {
      ok: false,
      error: 'Entrada temporariamente indisponível',
    })
  }

  const phone = normalizePhone(data.phone)
  if (!phone || !isE164(phone)) {
    return reply(request, 422, { ok: false, error: 'Telefone inválido' })
  }

  const requestedEventId = request.headers.get('idempotency-key')?.trim()
  if (requestedEventId && requestedEventId.length > 200) {
    return reply(request, 422, { ok: false, error: 'Chave de idempotência inválida' })
  }

  const supabase = createStaticAdminClient()
  const board = await supabase
    .from('boards')
    .select('id, organization_id')
    .eq('key', config.boardKey)
    .eq('organization_id', config.organizationId)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle()

  if (board.error || !board.data) {
    console.error('[site-lead] funil Sucção Zero não encontrado', board.error)
    return reply(request, 500, { ok: false, error: 'Funil não configurado' })
  }

  const boardId = board.data.id as string
  const stage = await supabase
    .from('board_stages')
    .select('id')
    .eq('board_id', boardId)
    .eq('organization_id', config.organizationId)
    .order('order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (stage.error || !stage.data) {
    console.error('[site-lead] etapa inicial Sucção Zero não encontrada', stage.error)
    return reply(request, 500, { ok: false, error: 'Funil sem etapas' })
  }

  try {
    const result = await ingestSuccaozeroLead(
      {
        source: 'site',
        externalEventId: requestedEventId || createSiteEventId(data),
        name: normalizeText(data.name) || 'Lead do site',
        phone,
        boardId,
        stageId: stage.data.id as string,
        metadata: metadata(data),
      },
      { organizationId: config.organizationId, supabase },
    )

    const needsAttention =
      result.status === 'pending_identity' || result.status === 'queued_without_owner'
    const status = needsAttention ? 202 : result.duplicate ? 200 : 201

    return reply(request, status, {
      ok: true,
      event_id: result.eventId,
      contact_id: result.crmContactId,
      deal_id: result.crmDealId,
      deal_created: !result.duplicate && Boolean(result.crmDealId),
      succaozero_contact_id: result.contactId,
      opportunity_id: result.opportunityId,
      owner_profile_id: result.ownerProfileId,
      duplicate: result.duplicate,
      status: result.status,
    })
  } catch (error) {
    console.error('[site-lead] falha na entrada transacional', error)
    return reply(request, 500, { ok: false, error: 'Erro ao gravar' })
  }
}
