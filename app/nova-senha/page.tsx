'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getErrorMessage } from '@/lib/utils/errorUtils'
import { limparTrocaDeSenha } from '@/lib/auth/trocarSenha'
import { Loader2, Lock } from 'lucide-react'

// Mesma regra da troca de senha no perfil.
function senhaValida(s: string) {
    return s.length >= 6 && /[a-z]/.test(s) && /[A-Z]/.test(s) && /\d/.test(s)
}

/** Página aberta pelo link do e-mail de senha nova ou de convite. */
export default function NovaSenhaPage() {
    const [senha, setSenha] = useState('')
    const [repetir, setRepetir] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (!senhaValida(senha)) {
            setError('A senha precisa ter 6 caracteres ou mais, com letra minúscula, letra maiúscula e número.')
            return
        }
        if (senha !== repetir) {
            setError('As senhas não coincidem.')
            return
        }
        setLoading(true)
        try {
            if (!supabase) throw new Error('Supabase não configurado.')
            const { error } = await supabase.auth.updateUser({ password: senha })
            if (error) throw error
            limparTrocaDeSenha()
            router.push('/dashboard')
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    const campo = 'block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 sm:text-sm'

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight mb-2">
                        Crie sua senha
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Use 6 caracteres ou mais, com letra minúscula, letra maiúscula e número.
                    </p>
                </div>

                <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-8">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {[
                            { id: 'nova-senha', rotulo: 'Senha nova', valor: senha, mudar: setSenha },
                            { id: 'repetir-senha', rotulo: 'Repita a senha', valor: repetir, mudar: setRepetir },
                        ].map((c) => (
                            <div key={c.id}>
                                <label htmlFor={c.id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    {c.rotulo}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id={c.id}
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        className={campo}
                                        value={c.valor}
                                        onChange={(e) => c.mudar(e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}

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
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Salvar senha e entrar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
