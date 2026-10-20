/**
 * @fileoverview Registro de documentos que o cliente mandou pelo WhatsApp (n8n/IA)
 * no negócio da agenda da Alice. Idempotente por `external_ref` de cada arquivo.
 */
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { SupabaseClient } from '@supabase/supabase-js'
import { advanceDealToRole } from '@/lib/agenda/stageRole'
import { variantesE164 } from '@/lib/agenda/phone'
import { addBusinessDays, checkFile, MAX_FILE_BYTES } from '@/lib/agenda/documentRules'

const BUCKET = 'deal-files'
const DOWNLOAD_TIMEOUT_MS = 30_000
/** Prazo total para baixar todos os arquivos de um pedido (a rota tem 60 s). */
export const PRAZO_DOWNLOADS_MS = 45_000
const MAX_REDIRECTS = 3

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

export type BaixarArquivo = (
  url: string,
  opts?: { signal?: AbortSignal },
) => Promise<{ bytes: ArrayBuffer; size: number }>

/** Nenhum negócio aberto para o telefone (ou negócio informado não existe). */
export class NegocioNaoEncontrado extends Error {
  constructor() {
    super('Negócio não encontrado')
    this.name = 'NegocioNaoEncontrado'
  }
}

type Resolver = (host: string) => Promise<string[]>
export interface DepsDownload {
  fetchImpl?: typeof fetch
  resolve?: Resolver
  signal?: AbortSignal
}

const resolverPadrao: Resolver = async (host) => {
  const r = await lookup(host, { all: true })
  return r.map((x) => x.address)
}

function ipv4Privado(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

/** Loopback, privado, link-local, CGNAT e não especificado (IPv4 e IPv6). */
export function ipBloqueado(ip: string): boolean {
  const v = isIP(ip)
  if (v === 4) return ipv4Privado(ip)
  if (v !== 6) return true
  const l = ip.toLowerCase()
  if (l === '::' || l === '::1') return true
  const mapeado = l.match(/^(?:0:0:0:0:0:|::)ffff:(.+)$/)
  if (mapeado) {
    const resto = mapeado[1]
    if (isIP(resto) === 4) return ipv4Privado(resto)
    const h = resto.split(':').map((x) => parseInt(x, 16))
    if (h.length === 2 && h.every((n) => !Number.isNaN(n))) {
      return ipv4Privado(`${h[0] >> 8}.${h[0] & 255}.${h[1] >> 8}.${h[1] & 255}`)
    }
    return true
  }
  const primeiro = parseInt(l.split(':')[0] || '0', 16)
  return (primeiro & 0xfe00) === 0xfc00 || (primeiro & 0xffc0) === 0xfe80
}

async function validarDestino(url: URL, resolve: Resolver): Promise<void> {
  if (url.protocol !== 'https:') throw new Error('Link inválido')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (isIP(host)) {
    if (ipBloqueado(host)) throw new Error('Destino não permitido')
    return
  }
  const ips = await resolve(host)
  if (!ips.length || ips.some(ipBloqueado)) throw new Error('Destino não permitido')
}

/** Baixa o arquivo pelo link: só https, sem rede interna, limite de tempo e de tamanho. */
export async function baixarArquivoSeguro(
  link: string,
  deps: DepsDownload = {},
): Promise<{ bytes: ArrayBuffer; size: number }> {
  const doFetch = deps.fetchImpl ?? fetch
  const resolve = deps.resolve ?? resolverPadrao
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS)
  const pararJunto = () => controller.abort()
  deps.signal?.addEventListener('abort', pararJunto, { once: true })
  try {
    if (deps.signal?.aborted) throw new Error('Download cancelado')
    let url = new URL(link)
    for (let salto = 0; ; salto++) {
      await validarDestino(url, resolve)
      const res = await doFetch(url.toString(), { signal: controller.signal, redirect: 'manual' })
      if (res.status >= 300 && res.status < 400) {
        const destino = res.headers.get('location')
        await res.body?.cancel().catch(() => undefined)
        if (!destino || salto >= MAX_REDIRECTS) throw new Error('Redirecionamentos demais')
        url = new URL(destino, url)
        continue
      }
      if (!res.ok) {
        await res.body?.cancel().catch(() => undefined)
        throw new Error(`Download falhou (${res.status})`)
      }
      const declarado = Number(res.headers.get('content-length') ?? 0)
      if (declarado > MAX_FILE_BYTES) {
        await res.body?.cancel().catch(() => undefined)
        return { bytes: new ArrayBuffer(0), size: declarado }
      }
      if (!res.body) {
        const bytes = await res.arrayBuffer()
        return { bytes, size: bytes.byteLength }
      }
      const reader = res.body.getReader()
      const partes: Uint8Array[] = []
      let total = 0
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.byteLength
        if (total > MAX_FILE_BYTES) {
          await reader.cancel().catch(() => undefined)
          return { bytes: new ArrayBuffer(0), size: total }
        }
        partes.push(value)
      }
      const out = new Uint8Array(total)
      let pos = 0
      for (const p of partes) {
        out.set(p, pos)
        pos += p.byteLength
      }
      return { bytes: out.buffer, size: total }
    }
  } finally {
    clearTimeout(timer)
    deps.signal?.removeEventListener('abort', pararJunto)
  }
}

export const baixarArquivoPadrao: BaixarArquivo = (link, opts) => baixarArquivoSeguro(link, { signal: opts?.signal })

class TempoEsgotado extends Error {}

/** Baixa com o tempo que sobra do prazo total; estourou, cancela e lança TempoEsgotado. */
async function baixarNoPrazo(fetchFile: BaixarArquivo, link: string, restanteMs: number) {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const estouro = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new TempoEsgotado())
    }, restanteMs)
  })
  try {
    return await Promise.race([fetchFile(link, { signal: controller.signal }), estouro])
  } finally {
    clearTimeout(timer)
  }
}

/** Parte do nome usada na chave do storage: ASCII, sem separadores, com extensão. */
export function nomeParaChave(nome: string): string {
  const limpo = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\\/]+/g, '-')
    .replace(/\.\./g, '')
  const ext = limpo.match(/\.[A-Za-z0-9]{1,10}$/)?.[0] ?? ''
  const base = (ext ? limpo.slice(0, -ext.length) : limpo)
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 100)
  return `${base || 'arquivo'}${ext}`
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

/** Dono da tarefa quando o negócio não tem dono: o primeiro admin da organização. */
async function primeiroAdmin(sb: SupabaseClient, organizationId: string): Promise<string | null> {
  const { data } = await sb
    .from('profiles')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('role', 'admin')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return (data?.id as string | undefined) ?? null
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
  const fimDosDownloads = Date.now() + PRAZO_DOWNLOADS_MS
  let tempoEsgotado = false

  for (const arquivo of entrada.files) {
    const { fileName, mimeType, externalRef } = arquivo
    // Prazo total estourado: o resto fica para o reenvio (por isso o external_ref por arquivo).
    if (tempoEsgotado) {
      skipped.push({ fileName, reason: 'tempo_esgotado' })
      continue
    }

    if (externalRef) {
      const ja = await sb
        .from('deal_files')
        .select('id')
        .eq('organization_id', organizationId)
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
    const restante = fimDosDownloads - Date.now()
    try {
      if (restante <= 0) throw new TempoEsgotado()
      baixado = await baixarNoPrazo(fetchFile, arquivo.url, restante)
    } catch (erro) {
      if (erro instanceof TempoEsgotado) tempoEsgotado = true
      skipped.push({ fileName, reason: tempoEsgotado ? 'tempo_esgotado' : 'falha_no_download' })
      continue
    }
    const check = checkFile({ mimeType, size: baixado.size })
    if (!check.ok) {
      skipped.push({ fileName, reason: check.reason })
      continue
    }

    const caminho = `${organizationId}/${negocio.id}/${Date.now()}-${nomeParaChave(fileName)}`
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
  if (nota && saved > 0) {
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

  // Uma tarefa "Analisar documentos" por vez: documento novo reaproveita a que
  // está aberta. Reenvio de tudo já recebido só refaz o pós-processamento se a
  // tarefa não existe.
  const recebeuNovo = saved > 0
  const tudoJaRecebido =
    entrada.files.length > 0 &&
    skipped.length === entrada.files.length &&
    skipped.every((x) => x.reason === 'ja_recebido')
  let executar = recebeuNovo || tudoJaRecebido
  let tarefaAbertaId: string | null = null
  if (executar) {
    const aberta = await sb
      .from('activities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('deal_id', negocio.id)
      .eq('type', 'TASK')
      .eq('completed', false)
      .is('deleted_at', null)
      .like('title', 'Analisar documentos de%')
      .limit(1)
      .maybeSingle()
    if (aberta.error) throw aberta.error
    tarefaAbertaId = (aberta.data?.id as string | undefined) ?? null
    if (!recebeuNovo && tarefaAbertaId) executar = false
  }

  let taskId: string | null = null
  if (executar) {
    const espera = await sb
      .from('deals')
      .update({ awaiting_documents: false })
      .eq('organization_id', organizationId)
      .eq('id', negocio.id)
    if (espera.error) warnings.push('falha_ao_atualizar_negocio')

    if (tarefaAbertaId) {
      taskId = tarefaAbertaId
    } else {
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
          owner_id: negocio.ownerId ?? (await primeiroAdmin(sb, organizationId)),
        })
        .select('id')
        .single()
      if (tarefa.error || !tarefa.data) warnings.push('falha_ao_criar_tarefa')
      else taskId = tarefa.data.id as string
    }

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
