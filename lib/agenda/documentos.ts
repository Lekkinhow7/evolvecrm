/**
 * @fileoverview Registro de documentos que o cliente mandou pelo WhatsApp (n8n/IA)
 * no negócio da agenda da Alice. Idempotente por `external_ref` de cada arquivo.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { advanceDealToRole } from '@/lib/agenda/stageRole'
import { variantesE164 } from '@/lib/agenda/phone'
import { addBusinessDays, checkFile, MAX_FILE_BYTES } from '@/lib/agenda/documentRules'

const BUCKET = 'deal-files'
const DOWNLOAD_TIMEOUT_MS = 30_000

export interface ArquivoEntrada {
  url: string
  fileName: string
  mimeType: string
  externalRef?: string
}

export interface EntradaDocumentos {
  organizationId: string
  phone?: string
  dealId?: string
  note?: string
  files: ArquivoEntrada[]
}

export interface ResultadoDocumentos {
  dealId: string
  saved: number
  skipped: { fileName: string; reason: string }[]
  taskId: string | null
  warnings: string[]
}

export type BaixarArquivo = (url: string) => Promise<{ bytes: ArrayBuffer; size: number }>

/** Nenhum negócio aberto para o telefone (ou negócio informado não existe). */
export class NegocioNaoEncontrado extends Error {
  constructor() {
    super('Negócio não encontrado')
    this.name = 'NegocioNaoEncontrado'
  }
}

/** Baixa o arquivo pelo link, com limite de 30 s. */
export const baixarArquivoPadrao: BaixarArquivo = async (url) => {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('Link inválido')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`Download falhou (${res.status})`)
    const declarado = Number(res.headers.get('content-length') ?? 0)
    if (declarado > MAX_FILE_BYTES) return { bytes: new ArrayBuffer(0), size: declarado }
    const bytes = await res.arrayBuffer()
    return { bytes, size: bytes.byteLength }
  } finally {
    clearTimeout(timer)
  }
}

/** Dia do calendário de hoje em São Paulo, ao meio-dia local (evita virada de dia). */
function hojeEmSaoPaulo(): Date {
  const [a, m, d] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .split('-')
    .map(Number)
  return new Date(a, m - 1, d, 12)
}

/** Prazo da análise: 2 dias úteis a partir de hoje (São Paulo), às 09:00 de São Paulo. */
function prazoAnalise(): string {
  const dia = addBusinessDays(hojeEmSaoPaulo(), 2)
  const p = (n: number) => String(n).padStart(2, '0')
  return new Date(`${dia.getFullYear()}-${p(dia.getMonth() + 1)}-${p(dia.getDate())}T09:00:00-03:00`).toISOString()
}

interface Negocio {
  id: string
  ownerId: string | null
  contactId: string | null
  nome: string
}

async function acharNegocio(
  sb: SupabaseClient,
  organizationId: string,
  dados: { dealId?: string; phone?: string },
): Promise<Negocio> {
  let query = sb
    .from('deals')
    .select('id, owner_id, contact_id, title')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)

  if (dados.dealId) {
    query = query.eq('id', dados.dealId)
  } else {
    const variantes = dados.phone ? variantesE164(dados.phone) : []
    if (!variantes.length) throw new NegocioNaoEncontrado()
    const contato = await sb
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .in('phone', variantes)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (contato.error) throw contato.error
    if (!contato.data) throw new NegocioNaoEncontrado()
    query = query
      .eq('contact_id', contato.data.id as string)
      .eq('is_won', false)
      .eq('is_lost', false)
      .order('created_at', { ascending: false })
      .limit(1)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  if (!data) throw new NegocioNaoEncontrado()

  const contactId = (data.contact_id as string) || null
  let nome = (data.title as string) || 'cliente'
  if (contactId) {
    const c = await sb
      .from('contacts')
      .select('name')
      .eq('organization_id', organizationId)
      .eq('id', contactId)
      .maybeSingle()
    if (c.data?.name) nome = c.data.name as string
  }
  return { id: data.id as string, ownerId: (data.owner_id as string) || null, contactId, nome }
}

export async function registrarDocumentos(
  sb: SupabaseClient,
  entrada: EntradaDocumentos,
  fetchFile: BaixarArquivo = baixarArquivoPadrao,
): Promise<ResultadoDocumentos> {
  const { organizationId } = entrada
  const negocio = await acharNegocio(sb, organizationId, { dealId: entrada.dealId, phone: entrada.phone })
  const warnings: string[] = []
  const skipped: { fileName: string; reason: string }[] = []
  let saved = 0

  for (const arquivo of entrada.files) {
    const { fileName, mimeType, externalRef } = arquivo

    if (externalRef) {
      const ja = await sb
        .from('deal_files')
        .select('id')
        .eq('deal_id', negocio.id)
        .eq('external_ref', externalRef)
        .maybeSingle()
      if (ja.error) throw ja.error
      if (ja.data) {
        skipped.push({ fileName, reason: 'ja_recebido' })
        continue
      }
    }

    // Tipo errado nem é baixado.
    const previa = checkFile({ mimeType, size: 0 })
    if (!previa.ok) {
      skipped.push({ fileName, reason: previa.reason })
      continue
    }

    let baixado: { bytes: ArrayBuffer; size: number }
    try {
      baixado = await fetchFile(arquivo.url)
    } catch {
      skipped.push({ fileName, reason: 'falha_no_download' })
      continue
    }
    const check = checkFile({ mimeType, size: baixado.size })
    if (!check.ok) {
      skipped.push({ fileName, reason: check.reason })
      continue
    }

    const caminho = `${organizationId}/${negocio.id}/${Date.now()}-${fileName}`
    const envio = await sb.storage.from(BUCKET).upload(caminho, baixado.bytes, { contentType: mimeType })
    if (envio.error) {
      skipped.push({ fileName, reason: 'falha_ao_gravar' })
      continue
    }

    const registro = await sb.from('deal_files').insert({
      organization_id: organizationId,
      deal_id: negocio.id,
      file_name: fileName,
      file_path: caminho,
      file_size: baixado.size,
      mime_type: mimeType,
      external_ref: externalRef ?? null,
    })
    if (registro.error) {
      await sb.storage.from(BUCKET).remove([caminho])
      // 23505: outro pedido gravou o mesmo external_ref no meio do caminho.
      skipped.push({ fileName, reason: registro.error.code === '23505' ? 'ja_recebido' : 'falha_ao_gravar' })
      continue
    }
    saved++
  }

  const nota = entrada.note?.trim()
  if (nota) {
    const r = await sb.from('activities').insert({
      organization_id: organizationId,
      title: 'Mensagem do cliente',
      type: 'NOTE',
      date: new Date().toISOString(),
      completed: true,
      description: `O cliente disse: ${nota}`,
      deal_id: negocio.id,
      contact_id: negocio.contactId,
    })
    if (r.error) warnings.push('falha_ao_gravar_nota')
  }

  let taskId: string | null = null
  if (saved > 0) {
    await sb
      .from('deals')
      .update({ awaiting_documents: false })
      .eq('organization_id', organizationId)
      .eq('id', negocio.id)

    const tarefa = await sb
      .from('activities')
      .insert({
        organization_id: organizationId,
        title: `Analisar documentos de ${negocio.nome}`,
        type: 'TASK',
        date: prazoAnalise(),
        completed: false,
        deal_id: negocio.id,
        contact_id: negocio.contactId,
        owner_id: negocio.ownerId,
      })
      .select('id')
      .single()
    if (tarefa.error || !tarefa.data) warnings.push('falha_ao_criar_tarefa')
    else taskId = tarefa.data.id as string

    try {
      const r = await advanceDealToRole(sb, {
        organizationId,
        dealId: negocio.id,
        role: 'analise_documentos',
      })
      if (r.warning) warnings.push(r.warning)
    } catch {
      warnings.push('falha_ao_mover')
    }
  }

  return { dealId: negocio.id, saved, skipped, taskId, warnings }
}
