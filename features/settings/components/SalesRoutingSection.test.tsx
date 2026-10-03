import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SalesRoutingSection } from './SalesRoutingSection'

const SELLER_A = '33333333-3333-4333-8333-333333333333'
const SELLER_B = '44444444-4444-4444-8444-444444444444'

describe('SalesRoutingSection', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sellers: [
          {
            profileId: SELLER_A,
            email: 'maria@example.com',
            position: 0,
            eligible: true,
            pausedUntil: null,
            lastAssignedAt: '2026-09-30T12:00:00Z',
          },
          {
            profileId: SELLER_B,
            email: 'joao@example.com',
            position: 1,
            eligible: true,
            pausedUntil: null,
            lastAssignedAt: null,
          },
        ],
        nextProfileId: SELLER_A,
        version: 2,
      }),
    }))
  })

  it('preserva a mensagem de carteira ao pausar vendedor', async () => {
    const user = userEvent.setup()
    render(<SalesRoutingSection />)

    await user.click(await screen.findByRole('button', { name: /pausar maria/i }))

    expect(screen.getByText(/oportunidades atuais continuarão/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reativar maria/i })).toBeInTheDocument()
  })

  it('reordena vendedores e salva posições contínuas', async () => {
    const user = userEvent.setup()
    render(<SalesRoutingSection />)
    await screen.findByText('maria@example.com')

    await user.click(screen.getByRole('button', { name: /mover joao.*para cima/i }))
    await user.click(screen.getByRole('button', { name: /salvar rodízio/i }))

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/admin/succaozero/sales-routing',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining(`"profileId":"${SELLER_B}","position":0`),
      }),
    )
  })
})
