import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/lib/query/hooks/useSuccaozeroNextActionsQuery', () => ({
  useSuccaozeroNextActionsQuery: (filter: string) => ({
    isLoading: false,
    error: null,
    data: filter === 'today' ? [{ opportunity: { id: '1', crm_deal_id: 'deal-1', title: 'Condomínio Azul' }, action: { id: 'a', kind: 'FOLLOW_UP' } }] : [],
  }),
}))

import { SuccaozeroNextActionsPanel } from './SuccaozeroNextActionsPanel'

describe('SuccaozeroNextActionsPanel', () => {
  it('separa hoje, atrasadas e sem próxima ação sem duplicar agenda técnica', () => {
    render(<SuccaozeroNextActionsPanel />)
    expect(screen.getByText('Hoje')).toBeInTheDocument()
    expect(screen.getByText('Atrasadas')).toBeInTheDocument()
    expect(screen.getByText('Sem próxima ação')).toBeInTheDocument()
    expect(screen.getByText(/agenda técnica continua separada/i)).toBeInTheDocument()
    expect(screen.getByText('Condomínio Azul')).toBeInTheDocument()
  })
})
