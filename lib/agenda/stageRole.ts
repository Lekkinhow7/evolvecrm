import type { SupabaseClient } from '@supabase/supabase-js'
import { moveStageByDealId } from '@/lib/public-api/dealsMoveStage'

export type StageRole = 'reuniao_agendada' | 'analise_documentos'

export type AdvanceWarning = 'negocio_fechado' | 'etapa_sem_papel' | 'ja_adiantado'

export function decideAdvance(input: {
  isWon: boolean
  isLost: boolean
  currentOrder: number | null
  targetOrder: number | null
}): { move: boolean; warning?: AdvanceWarning } {
  if (input.isWon || input.isLost) return { move: false, warning: 'negocio_fechado' }
  if (input.targetOrder == null) return { move: false, warning: 'etapa_sem_papel' }
  if (input.currentOrder != null && input.currentOrder >= input.targetOrder) {
    return { move: false, warning: 'ja_adiantado' }
  }
  return { move: true }
}

/** Acha a etapa do funil do negócio pelo papel e só avança (nunca recua). */
export async function advanceDealToRole(
  sb: SupabaseClient,
  opts: { organizationId: string; dealId: string; role: StageRole },
): Promise<{ moved: boolean; warning?: string }> {
  const { organizationId, dealId, role } = opts

  const { data: deal, error: dealError } = await sb
    .from('deals')
    .select('board_id, stage_id, is_won, is_lost')
    .eq('organization_id', organizationId)
    .eq('id', dealId)
    .maybeSingle()
  if (dealError || !deal) return { moved: false, warning: 'negocio_nao_encontrado' }

  const { data: stages, error: stagesError } = await sb
    .from('board_stages')
    .select('id, "order", role')
    .eq('organization_id', organizationId)
    .eq('board_id', deal.board_id)
  if (stagesError) return { moved: false, warning: 'falha_ao_ler_etapas' }

  const list = (stages ?? []) as Array<{ id: string; order: number; role: string | null }>
  const target = list.find((s) => s.role === role) ?? null
  const current = list.find((s) => s.id === deal.stage_id) ?? null

  const decision = decideAdvance({
    isWon: !!deal.is_won,
    isLost: !!deal.is_lost,
    currentOrder: current ? current.order : null,
    targetOrder: target ? target.order : null,
  })
  if (!decision.move || !target) return { moved: false, warning: decision.warning }

  const res = await moveStageByDealId({
    organizationId,
    dealId,
    target: { to_stage_id: target.id },
  })
  if (!res.ok) return { moved: false, warning: 'falha_ao_mover' }
  return { moved: true }
}
