import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ORG = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5'

vi.mock('@/lib/agenda/stageRole', () => ({
  advanceDealToRole: vi.fn(async () => ({ moved: true })),
}))

import { advanceDealToRole } from '@/lib/agenda/stageRole'
import { NegocioNaoEncontrado, registrarDocumentos } from './documentos'

type Handlers = Record<string, { maybeSingle?: unknown[]; single?: unknown[]; insertError?: any }>

function fakeSb(handlers: Handlers) {
  const inserts: Array<{ table: string; row: any }> = []
  const updates: Array<{ table: string; row: any }> = []
  const uploads: Array<{ path: string; opts: any }> = []
  const removed: string[][] = []
  const sb = {
    from(table: string) {
      const h = handlers[table] ?? {}
      const b: any = {}
      for (const m of ['select', 'eq', 'is', 'in', 'order', 'limit', 'like']) b[m] = () => b
      b.insert = (row: any) => {
        inserts.push({ table, row })
        return b
      }
      b.update = (row: any) => {
        updates.push({ table, row })
        return b
      }
      b.maybeSingle = async () => h.maybeSingle?.shift() ?? { data: null, error: null }
      b.single = async () => h.single?.shift() ?? { data: null, error: null }
      b.then = (res: any) => res({ data: null, error: h.insertError ?? null })
      return b
    },
    storage: {
      from: () => ({
        upload: async (path: string, _b: unknown, opts: any) => {
          uploads.push({ path, opts })
          return { error: null }
        },
        remove: async (paths: string[]) => {
          removed.push(paths)
          return { error: null }
        },
      }),
    },
  }
  return { sb: sb as any, inserts, updates, uploads, removed }
}

const negocio = { data: { id: 'd-1', owner_id: 'u-1', contact_id: 'c-1', title: 'Negócio' }, error: null }
const fetchOk = vi.fn(async () => ({ bytes: new ArrayBuffer(10), size: 10 }))
const pdf = { url: 'https://x/a.pdf', fileName: 'rg.pdf', mimeType: 'application/pdf', externalRef: 'm-1' }

describe('registrarDocumentos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T15:00:00Z')) // segunda-feira
  })
  afterEach(() => vi.useRealTimers())

  it('grava o arquivo, cria a tarefa, zera a espera e move a etapa', async () => {
    const { sb, inserts, updates, uploads } = fakeSb({
      deals: { maybeSingle: [negocio] },
      contacts: { maybeSingle: [{ data: { id: 'c-1' } }, { data: { name: 'Maria' } }] },
      deal_files: { maybeSingle: [{ data: null }] },
      activities: { single: [{ data: { id: 't-1' } }] },
    })
    const r = await registrarDocumentos(
      sb,
      { organizationId: ORG, phone: '71993042122', note: 'segue o RG', files: [pdf] },
      fetchOk,
    )
    expect(r).toEqual({ dealId: 'd-1', saved: 1, skipped: [], taskId: 't-1', warnings: [] })
    expect(uploads[0].path).toMatch(new RegExp(`^${ORG}/d-1/\\d+-rg\\.pdf$`))
    expect(uploads[0].opts).toEqual({ contentType: 'application/pdf' })
    expect(inserts.find((i) => i.table === 'deal_files')!.row).toMatchObject({
      organization_id: ORG,
      deal_id: 'd-1',
      file_name: 'rg.pdf',
      external_ref: 'm-1',
      file_size: 10,
    })
    const atividades = inserts.filter((i) => i.table === 'activities').map((i) => i.row)
    expect(atividades.find((a) => a.type === 'NOTE')).toMatchObject({
      deal_id: 'd-1',
      description: 'O cliente disse: segue o RG',
    })
    const tarefa = atividades.find((a) => a.type === 'TASK')
    expect(tarefa).toMatchObject({ title: 'Analisar documentos de Maria', owner_id: 'u-1', deal_id: 'd-1' })
    // segunda 19/10 + 2 dias úteis = quarta 21/10, 09:00 em São Paulo
    expect(tarefa.date).toBe('2026-10-21T12:00:00.000Z')
    expect(updates.find((u) => u.table === 'deals')!.row).toEqual({ awaiting_documents: false })
    expect(advanceDealToRole).toHaveBeenCalledWith(sb, {
      organizationId: ORG,
      dealId: 'd-1',
      role: 'analise_documentos',
    })
  })

  it('pula arquivo já recebido sem baixar nem enviar', async () => {
    const { sb, uploads, inserts } = fakeSb({
      deals: { maybeSingle: [negocio] },
      deal_files: { maybeSingle: [{ data: { id: 'f-1' } }] },
      activities: { maybeSingle: [{ data: { id: 't-0' } }] },
    })
    const r = await registrarDocumentos(sb, { organizationId: ORG, dealId: 'd-1', files: [pdf] }, fetchOk)
    expect(r.skipped).toEqual([{ fileName: 'rg.pdf', reason: 'ja_recebido' }])
    expect(r.saved).toBe(0)
    expect(r.taskId).toBeNull()
    expect(fetchOk).not.toHaveBeenCalled()
    expect(uploads).toHaveLength(0)
    expect(inserts.filter((i) => i.table === 'activities')).toHaveLength(0)
    expect(advanceDealToRole).not.toHaveBeenCalled()
  })

  it('pula vídeo e grava os outros', async () => {
    const { sb, uploads } = fakeSb({
      deals: { maybeSingle: [negocio] },
      deal_files: { maybeSingle: [{ data: null }, { data: null }] },
      activities: { single: [{ data: { id: 't-1' } }] },
    })
    const r = await registrarDocumentos(
      sb,
      {
        organizationId: ORG,
        dealId: 'd-1',
        files: [{ url: 'https://x/v.mp4', fileName: 'v.mp4', mimeType: 'video/mp4', externalRef: 'm-0' }, pdf],
      },
      fetchOk,
    )
    expect(r.skipped).toEqual([{ fileName: 'v.mp4', reason: 'tipo_nao_aceito' }])
    expect(r.saved).toBe(1)
    expect(uploads).toHaveLength(1)
  })

  it('sem nenhum arquivo salvo não cria tarefa', async () => {
    const { sb, inserts, updates } = fakeSb({ deals: { maybeSingle: [negocio] } })
    const r = await registrarDocumentos(
      sb,
      { organizationId: ORG, dealId: 'd-1', files: [{ url: 'https://x/v.mp4', fileName: 'v.mp4', mimeType: 'video/mp4' }] },
      fetchOk,
    )
    expect(r.taskId).toBeNull()
    expect(inserts).toHaveLength(0)
    expect(updates).toHaveLength(0)
  })

  it('arquivo grande demais é pulado', async () => {
    const { sb, uploads } = fakeSb({ deals: { maybeSingle: [negocio] } })
    const grande = vi.fn(async () => ({ bytes: new ArrayBuffer(0), size: 30_000_000 }))
    const r = await registrarDocumentos(
      sb,
      { organizationId: ORG, dealId: 'd-1', files: [{ ...pdf, externalRef: undefined }] },
      grande,
    )
    expect(r.skipped).toEqual([{ fileName: 'rg.pdf', reason: 'arquivo_grande' }])
    expect(uploads).toHaveLength(0)
  })

  it('falha ao mover a etapa vira aviso', async () => {
    vi.mocked(advanceDealToRole).mockRejectedValueOnce(new Error('x'))
    const { sb } = fakeSb({
      deals: { maybeSingle: [negocio] },
      deal_files: { maybeSingle: [{ data: null }] },
      activities: { single: [{ data: { id: 't-1' } }] },
    })
    const r = await registrarDocumentos(sb, { organizationId: ORG, dealId: 'd-1', files: [pdf] }, fetchOk)
    expect(r.warnings).toEqual(['falha_ao_mover'])
  })

  it('sem negócio aberto para o telefone lança NegocioNaoEncontrado', async () => {
    const { sb } = fakeSb({ contacts: { maybeSingle: [{ data: { id: 'c-1' } }] }, deals: { maybeSingle: [{ data: null }] } })
    await expect(
      registrarDocumentos(sb, { organizationId: ORG, phone: '71993042122', files: [pdf] }, fetchOk),
    ).rejects.toBeInstanceOf(NegocioNaoEncontrado)
  })

  it('reenvio com tudo já recebido não cria nota e cria a tarefa que faltou', async () => {
    const { sb, inserts, updates } = fakeSb({
      deals: { maybeSingle: [negocio] },
      deal_files: { maybeSingle: [{ data: { id: 'f-1' } }] },
      activities: { maybeSingle: [{ data: null }], single: [{ data: { id: 't-9' } }] },
    })
    const r = await registrarDocumentos(sb, { organizationId: ORG, dealId: 'd-1', note: 'oi', files: [pdf] }, fetchOk)
    expect(r.saved).toBe(0)
    expect(r.taskId).toBe('t-9')
    const atividades = inserts.filter((i) => i.table === 'activities').map((i) => i.row)
    expect(atividades.map((a) => a.type)).toEqual(['TASK'])
    expect(updates.find((u) => u.table === 'deals')!.row).toEqual({ awaiting_documents: false })
    expect(advanceDealToRole).toHaveBeenCalledOnce()
  })

  it('erro ao zerar awaiting_documents vira aviso', async () => {
    const { sb } = fakeSb({
      deals: { maybeSingle: [negocio], insertError: { message: 'x' } },
      deal_files: { maybeSingle: [{ data: null }] },
      activities: { single: [{ data: { id: 't-1' } }] },
    })
    const r = await registrarDocumentos(sb, { organizationId: ORG, dealId: 'd-1', files: [pdf] }, fetchOk)
    expect(r.warnings).toContain('falha_ao_atualizar_negocio')
  })

  it('sanitiza só a chave do storage e guarda o nome original', async () => {
    const { sb, uploads, inserts } = fakeSb({
      deals: { maybeSingle: [negocio] },
      activities: { single: [{ data: { id: 't-1' } }] },
    })
    await registrarDocumentos(
      sb,
      { organizationId: ORG, dealId: 'd-1', files: [{ ...pdf, externalRef: undefined, fileName: 'Relatório/../CNH João.pdf' }] },
      fetchOk,
    )
    expect(uploads[0].path.startsWith(`${ORG}/d-1/`)).toBe(true)
    expect(uploads[0].path.endsWith('-Relatorio-CNH-Joao.pdf')).toBe(true)
    expect(inserts.find((i) => i.table === 'deal_files')!.row.file_name).toBe('Relatório/../CNH João.pdf')
  })
})

describe('revisão final: documentos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T15:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('negócio sem dono: tarefa vai para o primeiro admin da organização', async () => {
    const eqsProfiles: Array<[string, unknown]> = []
    const ordens: unknown[][] = []
    const { sb, inserts } = fakeSb({
      deals: { maybeSingle: [{ data: { ...negocio.data, owner_id: null }, error: null }] },
      deal_files: { maybeSingle: [{ data: null }] },
      profiles: { maybeSingle: [{ data: { id: 'admin-1' }, error: null }] },
      activities: { single: [{ data: { id: 't-1' } }] },
    })
    const orig = sb.from.bind(sb)
    sb.from = (t: string) => {
      const b = orig(t)
      if (t === 'profiles') {
        b.eq = (c: string, v: unknown) => (eqsProfiles.push([c, v]), b)
        b.order = (...a: unknown[]) => (ordens.push(a), b)
      }
      return b
    }
    await registrarDocumentos(sb, { organizationId: ORG, dealId: 'd-1', files: [pdf] }, fetchOk)
    const tarefa = inserts.find((i) => i.table === 'activities' && i.row.type === 'TASK')!.row
    expect(tarefa.owner_id).toBe('admin-1')
    expect(eqsProfiles).toEqual([
      ['organization_id', ORG],
      ['role', 'admin'],
    ])
    expect(ordens[0]).toEqual(['created_at', { ascending: true }])
  })

  it('negócio com dono não consulta admins', async () => {
    const { sb, inserts } = fakeSb({
      deals: { maybeSingle: [negocio] },
      deal_files: { maybeSingle: [{ data: null }] },
      profiles: { maybeSingle: [{ data: { id: 'admin-1' }, error: null }] },
      activities: { single: [{ data: { id: 't-1' } }] },
    })
    await registrarDocumentos(sb, { organizationId: ORG, dealId: 'd-1', files: [pdf] }, fetchOk)
    expect(inserts.find((i) => i.row.type === 'TASK')!.row.owner_id).toBe('u-1')
  })

  it('downloads lentos: passou de 45 s, o resto vira tempo_esgotado e o salvo segue o fluxo', async () => {
    const sinais: AbortSignal[] = []
    const lento = vi.fn((url: string, opts?: { signal?: AbortSignal }) => {
      if (opts?.signal) sinais.push(opts.signal)
      const ms = url.endsWith('a.pdf') ? 20_000 : 600_000
      return new Promise<{ bytes: ArrayBuffer; size: number }>((res) =>
        setTimeout(() => res({ bytes: new ArrayBuffer(10), size: 10 }), ms),
      )
    })
    const { sb, uploads } = fakeSb({
      deals: { maybeSingle: [negocio] },
      deal_files: { maybeSingle: [{ data: null }, { data: null }, { data: null }] },
      activities: { single: [{ data: { id: 't-1' } }] },
    })
    const arquivos = [
      { ...pdf, url: 'https://x/a.pdf', fileName: 'a.pdf', externalRef: 'm-a' },
      { ...pdf, url: 'https://x/b.pdf', fileName: 'b.pdf', externalRef: 'm-b' },
      { ...pdf, url: 'https://x/c.pdf', fileName: 'c.pdf', externalRef: 'm-c' },
    ]
    const promessa = registrarDocumentos(sb, { organizationId: ORG, dealId: 'd-1', files: arquivos }, lento)
    await vi.advanceTimersByTimeAsync(46_000)
    const r = await promessa
    expect(r.saved).toBe(1)
    expect(r.skipped).toEqual([
      { fileName: 'b.pdf', reason: 'tempo_esgotado' },
      { fileName: 'c.pdf', reason: 'tempo_esgotado' },
    ])
    expect(lento).toHaveBeenCalledTimes(2)
    expect(sinais[1].aborted).toBe(true)
    expect(uploads).toHaveLength(1)
    expect(r.taskId).toBe('t-1')
    expect(advanceDealToRole).toHaveBeenCalledOnce()
  })
})
