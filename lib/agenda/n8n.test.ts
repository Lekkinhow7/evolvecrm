import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AgendaN8nError, chamarAgendaNoN8n } from './n8n'

describe('chamarAgendaNoN8n', () => {
  beforeEach(() => {
    process.env.N8N_AGENDA_URL = 'https://n8n.exemplo/webhook/agenda'
    process.env.N8N_RETORNO_SECRET = 'segredo'
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    delete process.env.N8N_AGENDA_URL
    delete process.env.N8N_RETORNO_SECRET
  })

  it('sem N8N_AGENDA_URL dá erro de ligação não configurada', async () => {
    delete process.env.N8N_AGENDA_URL
    await expect(chamarAgendaNoN8n('horarios_livres', {})).rejects.toThrow(
      new AgendaN8nError('Ligação da agenda com o n8n não configurada'),
    )
  })

  it('envia { acao, ...dados } com o cabeçalho de segredo', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: 1 }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const r = await chamarAgendaNoN8n<{ ok: number }>('agendar_reuniao', { deal_id: 'd1' })
    expect(r).toEqual({ ok: 1 })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://n8n.exemplo/webhook/agenda')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['x-retorno-secret']).toBe('segredo')
    expect(JSON.parse(init.body as string)).toEqual({ acao: 'agendar_reuniao', deal_id: 'd1' })
  })

  it('n8n 500 vira AgendaN8nError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('erro', { status: 500 })))
    await expect(chamarAgendaNoN8n('horarios_livres', {})).rejects.toBeInstanceOf(AgendaN8nError)
  })

  it('resposta ilegível vira AgendaN8nError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('não é json', { status: 200 })))
    await expect(chamarAgendaNoN8n('horarios_livres', {})).rejects.toThrow('Resposta do n8n ilegível')
  })

  it('aborta depois de 15 s', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_u: string, init: RequestInit) =>
          new Promise((_res, rej) => {
            init.signal!.addEventListener('abort', () => rej(new Error('abortado')))
          }),
      ),
    )
    const p = chamarAgendaNoN8n('horarios_livres', {})
    const verificado = expect(p).rejects.toThrow('Sem resposta do n8n')
    await vi.advanceTimersByTimeAsync(15_000)
    await verificado
  })
})
