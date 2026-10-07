'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getErrorMessage } from '@/lib/utils/errorUtils'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'

function EsqueciSenha() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [enviado, setEnviado] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const linkInvalido = useSearchParams().get('link') === 'invalido'
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            if (!supabase) throw new Error('Supabase não configurado.')
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
            if (error) throw error
            setEnviado(true)
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight mb-2">
                        Esqueci minha senha
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Digite seu e-mail e enviamos um link para criar uma senha nova.
                    </p>
                </div>

                <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-8">
                    {linkInvalido && !enviado && (
                        <div role="alert" className="mb-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-sm text-center">
                            Esse link já foi usado ou venceu. Peça um novo abaixo.
                        </div>
                    )}

                    {enviado ? (
                        <p className="text-center text-slate-700 dark:text-slate-300">
                            Se esse e-mail tiver acesso ao CRM, o link chega em alguns minutos. Confira também a caixa de spam.
                        </p>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 sm:text-sm"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-lg shadow-primary-500/20 text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Enviar link'}
                            </button>
                        </form>
                    )}
                </div>

                <p className="mt-6 text-center">
                    <Link href="/login" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Voltar para a entrada
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function EsqueciSenhaPage() {
    return (
        <Suspense>
            <EsqueciSenha />
        </Suspense>
    )
}
