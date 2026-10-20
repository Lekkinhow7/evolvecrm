/**
 * Normalização de linhas de `deals` vindas do Realtime (snake_case) para o
 * formato do cache (`DealView`, camelCase), e detecção de mudanças que não
 * são de etapa (selos do Kanban: aguardando documentos, valor, título).
 */
import type { DealView } from '@/types';

const RENOMEAR: Record<string, string> = {
  updated_at: 'updatedAt',
  created_at: 'createdAt',
  is_won: 'isWon',
  is_lost: 'isLost',
  closed_at: 'closedAt',
  last_stage_change_date: 'lastStageChangeDate',
  awaiting_documents: 'awaitingDocuments',
};

/** Linha do Realtime -> campos do cache. `stage_id` vira `status` (fonte da verdade da etapa). */
export function normalizarDealDoRealtime(linha: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...linha };
  for (const [de, para] of Object.entries(RENOMEAR)) {
    if (linha[de] !== undefined && linha[para] === undefined) {
      out[para] = linha[de];
      delete out[de];
    }
  }
  if (linha.stage_id !== undefined) {
    out.status = linha.stage_id;
    delete out.stage_id;
  }
  return out;
}

/** Campos fora da etapa que o Kanban mostra e que o Realtime deve atualizar mesmo sem mudar a etapa. */
export const CAMPOS_FORA_DA_ETAPA = ['awaitingDocuments', 'value', 'title'] as const;

/** Só os campos fora da etapa que mudaram em relação ao cache (vazio se nada mudou). */
export function mudancasForaDaEtapa(
  atual: DealView,
  normalizado: Record<string, unknown>,
): Partial<Pick<DealView, (typeof CAMPOS_FORA_DA_ETAPA)[number]>> {
  const mudou: Record<string, unknown> = {};
  for (const campo of CAMPOS_FORA_DA_ETAPA) {
    if (normalizado[campo] !== undefined && normalizado[campo] !== (atual as unknown as Record<string, unknown>)[campo]) {
      mudou[campo] = normalizado[campo];
    }
  }
  return mudou as Partial<Pick<DealView, (typeof CAMPOS_FORA_DA_ETAPA)[number]>>;
}
