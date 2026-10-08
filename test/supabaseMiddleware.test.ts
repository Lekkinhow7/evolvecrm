import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

type MockUser = { id: string }
const mocks = vi.hoisted(() => {
  const state = {
    currentUser: null as MockUser | null,
  }

  const nextResponseMock = {
    next: vi.fn((init?: unknown) => ({
      kind: 'next',
      init,
      cookies: {
        set: vi.fn(),
      },
    })),
    redirect: vi.fn((url: unknown) => ({
      kind: 'redirect',
      url,
    })),
  }

  const supabaseSsrMock = {
    createServerClient: vi.fn(() => ({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: state.currentUser } })),
      },
    })),
  }

  return { state, nextResponseMock, supabaseSsrMock }
})

vi.mock('next/server', () => ({
  NextResponse: mocks.nextResponseMock,
}))

vi.mock('@supabase/ssr', () => mocks.supabaseSsrMock)

import { updateSession } from '../lib/supabase/middleware'

type MockRequest = {
  nextUrl: {
    pathname: string
    clone(): { pathname: string }
  }
  cookies: {
    getAll(): unknown[]
    get(name: string): { value: string } | undefined
    set: ReturnType<typeof vi.fn>
  }
}

function makeRequest(pathname: string, cookies: Record<string, string> = {}) {
  const req: MockRequest = {
    nextUrl: {
      pathname,
      clone() {
        return { pathname }
      },
    },
    cookies: {
      getAll() {
        return Object.entries(cookies).map(([name, value]) => ({ name, value }))
      },
      get(name: string) {
        return name in cookies ? { value: cookies[name] } : undefined
      },
      set: vi.fn(),
    },
  }

  return req as unknown as NextRequest
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.state.currentUser = null

  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://example.supabase.local')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('updateSession (Proxy/Supabase)', () => {
  it('bypassa /api/* sem chamar Supabase', async () => {
    const req = makeRequest('/api/health')

    const res = await updateSession(req)

    expect(mocks.nextResponseMock.next).toHaveBeenCalledTimes(1)
    expect(mocks.supabaseSsrMock.createServerClient).not.toHaveBeenCalled()
    expect(res).toMatchObject({ kind: 'next' })
  })

  it('permite /setup sem autenticação (sem redirect)', async () => {
    const req = makeRequest('/setup')

    const res = await updateSession(req)

    expect(mocks.nextResponseMock.redirect).not.toHaveBeenCalled()
    expect(res).toMatchObject({ kind: 'next' })
  })

  it('permite /join/* sem autenticação (sem redirect)', async () => {
    const req = makeRequest('/join')

    const res = await updateSession(req)

    expect(mocks.nextResponseMock.redirect).not.toHaveBeenCalled()
    expect(res).toMatchObject({ kind: 'next' })
  })

  it('permite /auth/callback sem autenticação (sem redirect)', async () => {
    const req = makeRequest('/auth/callback')

    const res = await updateSession(req)

    expect(mocks.nextResponseMock.redirect).not.toHaveBeenCalled()
    expect(res).toMatchObject({ kind: 'next' })
  })

  it('redireciona rota protegida para /login quando não autenticado', async () => {
    const req = makeRequest('/dashboard')

    const res = await updateSession(req)

    expect(mocks.nextResponseMock.redirect).toHaveBeenCalledTimes(1)
    const [urlArg] = mocks.nextResponseMock.redirect.mock.calls[0]
    expect(urlArg).toMatchObject({ pathname: '/login' })
    expect(res).toMatchObject({ kind: 'redirect' })
  })

  it('redireciona usuário autenticado para /dashboard quando acessa /login', async () => {
    mocks.state.currentUser = { id: 'user-1' }
    const req = makeRequest('/login')

    const res = await updateSession(req)

    expect(mocks.nextResponseMock.redirect).toHaveBeenCalledTimes(1)
    const [urlArg] = mocks.nextResponseMock.redirect.mock.calls[0]
    expect(urlArg).toMatchObject({ pathname: '/dashboard' })
    expect(res).toMatchObject({ kind: 'redirect' })
  })

  it('quem entrou pelo link de senha nova só abre /nova-senha até salvar', async () => {
    mocks.state.currentUser = { id: 'user-1' }

    await updateSession(makeRequest('/dashboard', { trocar_senha: '1' }))
    const [urlArg] = mocks.nextResponseMock.redirect.mock.calls[0]
    expect(urlArg).toMatchObject({ pathname: '/nova-senha' })

    mocks.nextResponseMock.redirect.mockClear()
    const res = await updateSession(makeRequest('/nova-senha', { trocar_senha: '1' }))
    expect(mocks.nextResponseMock.redirect).not.toHaveBeenCalled()
    expect(res).toMatchObject({ kind: 'next' })
  })

  it('link novo do e-mail passa mesmo com sessão aberta', async () => {
    mocks.state.currentUser = { id: 'user-1' }

    const res = await updateSession(makeRequest('/auth/confirm', { trocar_senha: '1' }))

    expect(mocks.nextResponseMock.redirect).not.toHaveBeenCalled()
    expect(res).toMatchObject({ kind: 'next' })
  })
})
