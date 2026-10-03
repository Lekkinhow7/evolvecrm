import { z } from 'zod'

import { isE164, normalizePhoneE164 } from '@/lib/phone'

const SuccaozeroPhoneSchema = z
  .string()
  .max(30)
  .transform((value) => normalizePhoneE164(value) || null)
  .refine((value) => value === null || isE164(value), {
    message: 'Telefone inválido',
  })

export const SuccaozeroLeadInputSchema = z
  .object({
    source: z.enum(['site', 'whatsapp', 'agent', 'n8n', 'manual']),
    externalEventId: z.string().trim().min(1).max(200),
    name: z.string().trim().min(1).max(120),
    phone: SuccaozeroPhoneSchema.nullable().optional(),
    email: z.string().trim().toLowerCase().email().nullable().optional(),
    alternateIdentifier: z.string().trim().max(200).nullable().optional(),
    boardId: z.string().uuid(),
    stageId: z.string().uuid(),
    metadata: z.record(z.string(), z.unknown()).default({}),
  })
  .refine(
    (value) => Boolean(value.phone || value.email || value.alternateIdentifier),
    { message: 'Uma identidade é obrigatória' },
  )

export const SuccaozeroIntakeResultSchema = z.object({
  eventId: z.string().uuid(),
  contactId: z.string().uuid(),
  opportunityId: z.string().uuid().nullable(),
  crmContactId: z.string().uuid().nullable(),
  crmDealId: z.string().uuid().nullable(),
  ownerProfileId: z.string().uuid().nullable(),
  duplicate: z.boolean(),
  status: z.enum(['processed', 'pending_identity', 'queued_without_owner']),
})

export type SuccaozeroLeadInput = z.infer<typeof SuccaozeroLeadInputSchema>
export type SuccaozeroIntakeResult = z.infer<typeof SuccaozeroIntakeResultSchema>

export interface SuccaozeroRpcError {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}
