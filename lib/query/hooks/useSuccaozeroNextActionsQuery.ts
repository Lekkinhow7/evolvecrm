import { useQuery } from '@tanstack/react-query'

export type SuccaozeroNextActionFilter = 'today' | 'overdue' | 'missing'
export const succaozeroNextActionKeys = {
  all: ['succaozero', 'next-actions'] as const,
  list: (filter: SuccaozeroNextActionFilter) => ['succaozero', 'next-actions', filter] as const,
}

export interface SuccaozeroNextActionItem {
  opportunity: { id: string; crm_deal_id: string | null; title: string; owner_profile_id: string | null }
  action: { id: string; kind: string; due_at: string; executor_profile_id: string } | null
}

export function useSuccaozeroNextActionsQuery(filter: SuccaozeroNextActionFilter) {
  return useQuery({
    queryKey: succaozeroNextActionKeys.list(filter),
    queryFn: async () => {
      const response = await fetch(`/api/succaozero/next-actions?filter=${filter}`, { credentials: 'include' })
      const body = await response.json()
      if (!response.ok) throw new Error(body?.error || 'Falha ao carregar próximas ações')
      return (body.data || []) as SuccaozeroNextActionItem[]
    },
  })
}
