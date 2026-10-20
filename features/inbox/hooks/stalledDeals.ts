import type { DealView } from '@/types';
import { formatBRL } from '@/lib/utils/brFormat';

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Último movimento do negócio: o mais recente entre a edição do negócio e a
 * última mensagem da conversa do contato. Lead que está conversando no
 * WhatsApp não está parado, mesmo que ninguém tenha mexido no card.
 */
export function lastMovementTs(deal: DealView, lastMessageByContact: Map<string, number>): number {
  const updatedTs = Date.parse(deal.updatedAt) || 0;
  const messageTs = deal.contactId ? lastMessageByContact.get(deal.contactId) ?? 0 : 0;
  return Math.max(updatedTs, messageTs);
}

/** Negócio aberto sem movimento desde `cutoffTs`. */
export function isDealStalled(
  deal: DealView,
  lastMessageByContact: Map<string, number>,
  cutoffTs: number,
): boolean {
  if (deal.isWon || deal.isLost) return false;
  return lastMovementTs(deal, lastMessageByContact) < cutoffTs;
}

export function daysSince(ts: number, now = Date.now()): number {
  return Math.max(0, Math.floor((now - ts) / DAY_MS));
}

/** "Thalita Sá · Novo lead · R$ 1.500" — sem valor quando o negócio não tem valor. */
export function describeStalledDeal(deal: DealView): string {
  const parts = [deal.contactName || deal.title];
  if (deal.stageLabel) parts.push(deal.stageLabel);
  if (deal.value > 0) parts.push(formatBRL(deal.value));
  return parts.join(' · ');
}

