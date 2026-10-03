import type { SupabaseClient } from '@supabase/supabase-js'

import type { SuccaozeroLeadInput, SuccaozeroRpcError } from './types'

export interface SuccaozeroIngestPayload extends SuccaozeroLeadInput {
  organization_id: string
}

export interface SuccaozeroIngestRpcResponse {
  data: unknown
  error: SuccaozeroRpcError | null
}

export async function callSuccaozeroIngestRpc(
  supabase: SupabaseClient,
  payload: SuccaozeroIngestPayload,
): Promise<SuccaozeroIngestRpcResponse> {
  const { data, error } = await supabase.rpc('succaozero_ingest_lead', {
    p_payload: payload,
  })

  return { data, error }
}
