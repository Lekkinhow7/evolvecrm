'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Loader2, Pause, Play, Save } from 'lucide-react'

interface RoutingSeller {
  profileId: string
  email: string
  position: number
  eligible: boolean
  pausedUntil: string | null
  lastAssignedAt: string | null
}

interface RoutingResponse {
  sellers: RoutingSeller[]
  nextProfileId: string | null
  version: number
  warning?: string | null
}

const ENDPOINT = '/api/admin/succaozero/sales-routing'
const PAUSED_UNTIL = '9999-12-31T23:59:59.999Z'

export function SalesRoutingSection() {
  const [sellers, setSellers] = useState<RoutingSeller[]>([])
  const [nextProfileId, setNextProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void fetch(ENDPOINT, { credentials: 'include' })
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body?.error || 'Falha ao carregar o rodízio')
        if (!active) return
        const data = body as RoutingResponse
        setSellers(data.sellers || [])
        setNextProfileId(data.nextProfileId || null)
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Falha ao carregar o rodízio')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const normalized = useMemo(
    () => sellers.map((seller, position) => ({ ...seller, position })),
    [sellers],
  )

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= sellers.length) return
    setSellers((current) => {
      const copy = [...current]
      ;[copy[index], copy[target]] = [copy[target], copy[index]]
      return copy
    })
    setMessage(null)
  }

  const togglePause = (profileId: string) => {
    setSellers((current) => current.map((seller) => {
      if (seller.profileId !== profileId) return seller
      const paused = Boolean(seller.pausedUntil) || !seller.eligible
      return {
        ...seller,
        eligible: true,
        pausedUntil: paused ? null : PAUSED_UNTIL,
      }
    }))
    setMessage('As oportunidades atuais continuarão com este responsável.')
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(ENDPOINT, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sellers: normalized.map((seller) => ({
            profileId: seller.profileId,
            position: seller.position,
            eligible: seller.eligible,
            pausedUntil: seller.pausedUntil,
          })),
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body?.error || 'Falha ao salvar o rodízio')
      setNextProfileId(body.nextProfileId || null)
      setMessage(body.warning || 'Rodízio salvo.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao salvar o rodízio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Rodízio comercial</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Defina a ordem de distribuição. A lista pode crescer sem alterar a regra do CRM.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={loading || saving}
          aria-label="Salvar rodízio"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando rodízio...
        </div>
      ) : normalized.length === 0 ? (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          Sem vendedor no rodízio. Novos leads ficarão aguardando responsável.
        </p>
      ) : (
        <div className="space-y-2">
          {normalized.map((seller, index) => {
            const paused = Boolean(seller.pausedUntil) || !seller.eligible
            return (
              <div key={seller.profileId} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <span className="w-7 text-center text-sm font-semibold text-slate-400">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-slate-900 dark:text-white">{seller.email}</span>
                    {seller.profileId === nextProfileId && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Próximo
                      </span>
                    )}
                    <span className={`text-xs ${paused ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {paused ? 'Pausado' : 'Ativo'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {seller.lastAssignedAt
                      ? `Última atribuição: ${new Date(seller.lastAssignedAt).toLocaleString('pt-BR')}`
                      : 'Sem atribuição registrada'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label={`Mover ${seller.email} para cima`} disabled={index === 0} onClick={() => move(index, -1)} className="rounded-lg p-2 disabled:opacity-30">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label={`Mover ${seller.email} para baixo`} disabled={index === normalized.length - 1} onClick={() => move(index, 1)} className="rounded-lg p-2 disabled:opacity-30">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label={`${paused ? 'Reativar' : 'Pausar'} ${seller.email}`} onClick={() => togglePause(seller.profileId)} className="rounded-lg p-2">
                    {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {message && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  )
}
