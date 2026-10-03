import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'

import {
  ingestSuccaozeroLead,
  SuccaozeroIntakeError,
} from '@/lib/succaozero/intake'

const ORGANIZATION_ID = '11111111-1111-4111-8111-111111111111'
const BOARD_ID = '22222222-2222-4222-8222-222222222222'
const STAGE_ID = '33333333-3333-4333-8333-333333333333'
const EVENT_ID = '44444444-4444-4444-8444-444444444444'
const CONTACT_ID = '55555555-5555-4555-8555-555555555555'
const OPPORTUNITY_ID = '66666666-6666-4666-8666-666666666666'
const CRM_CONTACT_ID = '77777777-7777-4777-8777-777777777777'
const CRM_DEAL_ID = '88888888-8888-4888-8888-888888888888'
const OWNER_ID = '99999999-9999-4999-8999-999999999999'

function validResult(overrides: Record<string, unknown> = {}) {
  return {
    eventId: EVENT_ID,
    contactId: CONTACT_ID,
    opportunityId: OPPORTUNITY_ID,
    crmContactId: CRM_CONTACT_ID,
    crmDealId: CRM_DEAL_ID,
    ownerProfileId: OWNER_ID,
    duplicate: false,
    status: 'processed',
    ...overrides,
  }
}

function context(data: unknown = validResult(), error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error })
  return {
    rpc,
    value: {
      organizationId: ORGANIZATION_ID,
      supabase: { rpc } as unknown as SupabaseClient,
    },
  }
}

function validLead(overrides: Record<string, unknown> = {}) {
  return {
    source: 'site',
    externalEventId: 'site:event-001',
    name: '  Maria da Silva  ',
    phone: '(11) 99999-0000',
    boardId: BOARD_ID,
    stageId: STAGE_ID,
    metadata: {},
    ...overrides,
  }
}

describe('ingestSuccaozeroLead', () => {
  it('rejeita telefone inválido antes de chamar o banco', async () => {
    const ctx = context()

    await expect(
      ingestSuccaozeroLead(validLead({ phone: 'telefone-inválido' }), ctx.value),
    ).rejects.toThrow()
    expect(ctx.rpc).not.toHaveBeenCalled()
  })

  it('aceita somente @lid e preserva a identidade alternativa', async () => {
    const ctx = context(
      validResult({
        opportunityId: null,
        crmContactId: null,
        crmDealId: null,
        ownerProfileId: null,
        status: 'pending_identity',
      }),
    )

    const result = await ingestSuccaozeroLead(
      validLead({ phone: null, alternateIdentifier: '5511999990000@lid' }),
      ctx.value,
    )

    expect(result.status).toBe('pending_identity')
    expect(ctx.rpc).toHaveBeenCalledWith('succaozero_ingest_lead', {
      p_payload: expect.objectContaining({
        organization_id: ORGANIZATION_ID,
        alternateIdentifier: '5511999990000@lid',
        phone: null,
      }),
    })
  })

  it('normaliza telefone e preserva metadados UTM no payload', async () => {
    const ctx = context()
    const metadata = {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'limpeza-de-piscina',
    }

    await ingestSuccaozeroLead(validLead({ metadata }), ctx.value)

    expect(ctx.rpc).toHaveBeenCalledWith('succaozero_ingest_lead', {
      p_payload: expect.objectContaining({
        organization_id: ORGANIZATION_ID,
        name: 'Maria da Silva',
        phone: '+5511999990000',
        metadata,
      }),
    })
  })

  it('retorna de forma estável um evento duplicado', async () => {
    const ctx = context(validResult({ duplicate: true }))

    await expect(ingestSuccaozeroLead(validLead(), ctx.value)).resolves.toEqual(
      validResult({ duplicate: true }),
    )
  })

  it('converte erro do RPC em erro estruturado do domínio', async () => {
    const ctx = context(null, {
      code: 'P0001',
      message: 'Funil fora da organização Sucção Zero',
      details: 'board_id não pertence à organização',
      hint: 'Revise o funil configurado',
    })

    const promise = ingestSuccaozeroLead(validLead(), ctx.value)

    await expect(promise).rejects.toMatchObject({
      name: 'SuccaozeroIntakeError',
      code: 'P0001',
      message: 'Funil fora da organização Sucção Zero',
      details: 'board_id não pertence à organização',
      hint: 'Revise o funil configurado',
    } satisfies Partial<SuccaozeroIntakeError>)
  })
})
