import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { COOKIE_TROCAR_SENHA, COOKIE_TROCAR_SENHA_SEGUNDOS } from '@/lib/auth/trocarSenha'

const TIPOS: EmailOtpType[] = ['recovery', 'invite', 'signup', 'magiclink', 'email', 'email_change']

// Quem recebe o link de senha nova ou de convite precisa criar a senha antes de entrar.
function destinoPadrao(tipo: EmailOtpType) {
    return tipo === 'recovery' || tipo === 'invite' ? '/nova-senha' : '/dashboard'
}

// Na VPS o servidor roda atrás de um proxy e enxerga 0.0.0.0:3000 como endereço.
function enderecoPublico(request: Request, origin: string) {
    const host = request.headers.get('x-forwarded-host')
    if (process.env.NODE_ENV === 'development') return origin
    if (!host) return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || origin
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    return `${proto}://${host}`
}

/**
 * Link dos e-mails de acesso (senha nova, convite, confirmação, troca de e-mail).
 * Usa o token do e-mail direto, então funciona mesmo aberto em outro aparelho.
 */
export async function GET(request: Request) {
    const url = new URL(request.url)
    const { searchParams } = url
    const origin = enderecoPublico(request, url.origin)
    const tokenHash = searchParams.get('token_hash')
    const tipo = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next')

    if (tokenHash && tipo && TIPOS.includes(tipo)) {
        const supabase = await createClient()
        const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash })
        if (!error) {
            // Só aceita caminho interno, nunca outro site.
            const destino = next && next.startsWith('/') && !next.startsWith('//') ? next : destinoPadrao(tipo)
            const resposta = NextResponse.redirect(`${origin}${destino}`)
            if (destinoPadrao(tipo) === '/nova-senha') {
                resposta.cookies.set(COOKIE_TROCAR_SENHA, '1', {
                    path: '/',
                    maxAge: COOKIE_TROCAR_SENHA_SEGUNDOS,
                    sameSite: 'lax',
                    secure: origin.startsWith('https'),
                })
            }
            return resposta
        }
    }

    return NextResponse.redirect(`${origin}/login/esqueci?link=invalido`)
}
