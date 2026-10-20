import { describe, expect, it, vi } from 'vitest'

import { baixarArquivoSeguro, ipBloqueado } from './documentos'

const publico = async () => ['93.184.216.34']

function resp(status: number, body?: Uint8Array[], headers: Record<string, string> = {}) {
  const stream = body
    ? new ReadableStream<Uint8Array>({
        start(c) {
          body.forEach((p) => c.enqueue(p))
          c.close()
        },
      })
    : null
  return new Response(stream, { status, headers })
}

describe('ipBloqueado', () => {
  it.each([
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.1', '192.168.0.5', '169.254.169.254',
    '100.64.0.1', '0.0.0.0', '::1', '::', 'fc00::1', 'fd12::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:7f00:1',
  ])('bloqueia %s', (ip) => expect(ipBloqueado(ip)).toBe(true))
  it.each(['93.184.216.34', '172.32.0.1', '2606:4700::1'])('libera %s', (ip) => expect(ipBloqueado(ip)).toBe(false))
})

describe('baixarArquivoSeguro', () => {
  it('baixa arquivo https público', async () => {
    const fetchImpl = vi.fn(async () => resp(200, [new Uint8Array(5)]))
    const r = await baixarArquivoSeguro('https://x.com/a.pdf', { fetchImpl: fetchImpl as any, resolve: publico })
    expect(r.size).toBe(5)
    expect(fetchImpl).toHaveBeenCalledWith('https://x.com/a.pdf', expect.objectContaining({ redirect: 'manual' }))
  })

  it('rejeita http', async () => {
    const fetchImpl = vi.fn()
    await expect(
      baixarArquivoSeguro('http://x.com/a.pdf', { fetchImpl: fetchImpl as any, resolve: publico }),
    ).rejects.toThrow()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('rejeita host que resolve para IP privado', async () => {
    const fetchImpl = vi.fn()
    await expect(
      baixarArquivoSeguro('https://interno.com/a', { fetchImpl: fetchImpl as any, resolve: async () => ['10.0.0.5'] }),
    ).rejects.toThrow()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('rejeita IP literal privado', async () => {
    const fetchImpl = vi.fn()
    await expect(
      baixarArquivoSeguro('https://169.254.169.254/latest', { fetchImpl: fetchImpl as any, resolve: publico }),
    ).rejects.toThrow()
    await expect(
      baixarArquivoSeguro('https://[::1]/x', { fetchImpl: fetchImpl as any, resolve: publico }),
    ).rejects.toThrow()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('rejeita redirecionamento para host privado', async () => {
    const resolve = async (h: string) => (h === 'interno.com' ? ['192.168.1.1'] : ['93.184.216.34'])
    const fetchImpl = vi.fn(async () => resp(302, undefined, { location: 'https://interno.com/x' }))
    await expect(baixarArquivoSeguro('https://x.com/a', { fetchImpl: fetchImpl as any, resolve })).rejects.toThrow()
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('rejeita mais de 3 redirecionamentos', async () => {
    const fetchImpl = vi.fn(async () => resp(301, undefined, { location: 'https://x.com/b' }))
    await expect(
      baixarArquivoSeguro('https://x.com/a', { fetchImpl: fetchImpl as any, resolve: publico }),
    ).rejects.toThrow()
    expect(fetchImpl).toHaveBeenCalledTimes(4)
  })

  it('segue até 3 redirecionamentos', async () => {
    let n = 0
    const fetchImpl = vi.fn(async () =>
      n++ < 3 ? resp(302, undefined, { location: '/n' + n }) : resp(200, [new Uint8Array(2)]),
    )
    const r = await baixarArquivoSeguro('https://x.com/a', { fetchImpl: fetchImpl as any, resolve: publico })
    expect(r.size).toBe(2)
  })

  it('corta o corpo acima do limite mesmo sem content-length', async () => {
    const parte = new Uint8Array(10 * 1024 * 1024)
    const fetchImpl = vi.fn(async () => resp(200, [parte, parte, parte]))
    const r = await baixarArquivoSeguro('https://x.com/a', { fetchImpl: fetchImpl as any, resolve: publico })
    expect(r.size).toBeGreaterThan(26214400)
    expect(r.bytes.byteLength).toBe(0)
  })

  it('content-length grande demais cancela sem ler', async () => {
    const fetchImpl = vi.fn(async () => resp(200, [new Uint8Array(1)], { 'content-length': '30000000' }))
    const r = await baixarArquivoSeguro('https://x.com/a', { fetchImpl: fetchImpl as any, resolve: publico })
    expect(r.size).toBe(30000000)
  })
})

describe('baixarArquivoSeguro com sinal de fora', () => {
  it('sinal abortado durante o download aborta o fetch', async () => {
    const externo = new AbortController()
    let sinalDoFetch: AbortSignal | undefined
    const fetchImpl = vi.fn(async (_u: string, init: RequestInit) => {
      sinalDoFetch = init.signal as AbortSignal
      externo.abort()
      return resp(200, [new Uint8Array(5)])
    })
    await baixarArquivoSeguro('https://x.com/a.pdf', { fetchImpl: fetchImpl as any, resolve: publico, signal: externo.signal })
    expect(sinalDoFetch?.aborted).toBe(true)
  })

  it('sinal já abortado nem chama o fetch', async () => {
    const externo = new AbortController()
    externo.abort()
    const fetchImpl = vi.fn()
    await expect(
      baixarArquivoSeguro('https://x.com/a.pdf', { fetchImpl: fetchImpl as any, resolve: publico, signal: externo.signal }),
    ).rejects.toThrow()
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
