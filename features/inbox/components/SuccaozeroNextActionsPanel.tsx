'use client'

import { useRouter } from 'next/navigation'

import { useSuccaozeroNextActionsQuery, type SuccaozeroNextActionFilter } from '@/lib/query/hooks/useSuccaozeroNextActionsQuery'

const sections: Array<{ filter: SuccaozeroNextActionFilter; title: string }> = [
  { filter: 'today', title: 'Hoje' },
  { filter: 'overdue', title: 'Atrasadas' },
  { filter: 'missing', title: 'Sem próxima ação' },
]

function NextActionColumn({ filter, title }: { filter: SuccaozeroNextActionFilter; title: string }) {
  const router = useRouter()
  const query = useSuccaozeroNextActionsQuery(filter)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">{query.data?.length || 0}</span>
      </div>
      {query.isLoading ? <p className="text-sm text-slate-400">Carregando...</p> : query.error ? <p className="text-sm text-red-600">Falha ao carregar</p> : query.data?.length ? (
        <div className="space-y-2">{query.data.map((item) => (
          <button key={item.opportunity.id} type="button" onClick={() => item.opportunity.crm_deal_id && router.push(`/deals/${item.opportunity.crm_deal_id}`)} className="block w-full rounded-xl bg-slate-50 p-3 text-left hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10">
            <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item.opportunity.title}</span>
            <span className="mt-1 block text-xs text-slate-500">{item.action ? item.action.kind : 'Defina responsável e prazo'}</span>
          </button>
        ))}</div>
      ) : <p className="text-sm text-slate-400">Não há pendências.</p>}
    </div>
  )
}

export function SuccaozeroNextActionsPanel() {
  return (
    <section className="mb-8" aria-label="Próximas ações comerciais">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Acompanhamento comercial</h2>
        <p className="text-sm text-slate-500">Pendências de venda; a agenda técnica continua separada.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">{sections.map((section) => <NextActionColumn key={section.filter} {...section} />)}</div>
    </section>
  )
}
