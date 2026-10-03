import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { callSuccaozeroIngestRpc } from './repository'
import {
  SuccaozeroIntakeResultSchema,
  SuccaozeroLeadInputSchema,
  type SuccaozeroIntakeResult,
  type SuccaozeroRpcError,
} from './types'

export class SuccaozeroIntakeError extends Error {
  readonly code: string
  readonly details: string | null
  readonly hint: string | null

  constructor(
    message: string,
    options: {
      code?: string | null
      details?: string | null
      hint?: string | null
      cause?: unknown
    } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = 'SuccaozeroIntakeError'
    this.code = options.code || 'SUCCAOZERO_INTAKE_ERROR'
    this.details = options.details || null
    this.hint = options.hint || null
  }

  static fromRpcError(error: SuccaozeroRpcError): SuccaozeroIntakeError {
    return new SuccaozeroIntakeError(
      error.message || 'Falha ao processar a entrada Sucção Zero',
      {
        code: error.code || 'SUCCAOZERO_RPC_ERROR',
        details: error.details,
        hint: error.hint,
        cause: error,
      },
    )
  }
}

export interface SuccaozeroIntakeContext {
  organizationId: string
  supabase: SupabaseClient
}

function failedResult(data: unknown): { errorCode?: unknown; status?: unknown } | null {
  if (!data || typeof data !== 'object') return null
  const candidate = data as { errorCode?: unknown; status?: unknown }
  return candidate.status === 'failed' ? candidate : null
}

export async function ingestSuccaozeroLead(
  raw: unknown,
  context: SuccaozeroIntakeContext,
): Promise<SuccaozeroIntakeResult> {
  const input = SuccaozeroLeadInputSchema.parse(raw)
  const organizationId = z.string().uuid().parse(context.organizationId)
  const { data, error } = await callSuccaozeroIngestRpc(context.supabase, {
    ...input,
    organization_id: organizationId,
  })

  if (error) throw SuccaozeroIntakeError.fromRpcError(error)

  const failure = failedResult(data)
  if (failure) {
    const code =
      typeof failure.errorCode === 'string'
        ? failure.errorCode
        : 'SUCCAOZERO_INGEST_FAILED'
    throw new SuccaozeroIntakeError('Entrada Sucção Zero não processada', {
      code,
      details: JSON.stringify(data),
    })
  }

  const parsed = SuccaozeroIntakeResultSchema.safeParse(data)
  if (!parsed.success) {
    throw new SuccaozeroIntakeError('Resposta inválida da entrada Sucção Zero', {
      code: 'INVALID_RPC_RESULT',
      details: parsed.error.message,
      cause: parsed.error,
    })
  }

  return parsed.data
}

export type { SuccaozeroIntakeResult, SuccaozeroLeadInput } from './types'
export { SuccaozeroIntakeResultSchema, SuccaozeroLeadInputSchema } from './types'
