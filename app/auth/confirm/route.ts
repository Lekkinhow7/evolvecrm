import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const TIPOS: EmailOtpType[] = ['recovery', 'invite', 'signup', 'magiclink', 'email', 'email_change']

// Quem recebe o link de senha nova ou de convite precisa criar a senha antes de entrar.
function destinoPadrao(tipo: EmailOtpType) {
    return tipo === 'recovery' || tipo === 'invite' ? '/nova-senha' : '/dashboard'
}

/**
 * Link dos e-mails de acesso (senha nova, convite, confirmação, troca de e-mail).
 * Usa o token do e-mail direto, então funciona mesmo aberto em outro aparelho.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const tokenHash = searchParams.get('token_hash')
    const tipo = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next')

    if (tokenHash && tipo && TIPOS.includes(tipo)) {
        const supabase = await createClient()
        const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash })
        if (!error) {
            // Só aceita caminho interno, nunca outro site.
            const destino = next && next.startsWith('/') && !next.startsWith('//') ? next : destinoPadrao(tipo)
            return NextResponse.redirect(`${origin}${destino}`)
        }
    }

    return NextResponse.redirect(`${origin}/login/esqueci?link=invalido`)
}
