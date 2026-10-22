'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { useDealsView } from '@/lib/query/hooks/useDealsQuery';
import { useBoards } from '@/lib/query/hooks/useBoardsQuery';
import { useLifecycleStages } from '@/lib/query/hooks/useLifecycleStagesQuery';
import { useMoveDealSimple } from '@/lib/query/hooks';
import { useToast } from '@/context/ToastContext';
import { LossReasonModal } from '@/components/ui/LossReasonModal';
import { summarizeConversation } from '@/lib/ai/tasksClient';
import type { DealView } from '@/types';

interface ConversationDealBarProps {
  conversationId: string;
  contactId?: string | null;
}

const PILL =
  'inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-[13px] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-sunken)] disabled:opacity-50';

/** Negócio do contato que aparece na conversa: o aberto mais recente; sem aberto, o mais recente. */
export function pickContactDeal(deals: DealView[], contactId?: string | null): DealView | undefined {
  if (!contactId) return undefined;
  const mine = deals
    .filter((d) => d.contactId === contactId)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return mine.find((d) => !d.isWon && !d.isLost) ?? mine[0];
}

/**
 * Barra abaixo do topo da conversa: a etapa do cliente no Kanban (a equipe
 * muda à mão, nada se move sozinho) e o botão Resumo, que pede à IA um
 * resumo do que já foi falado.
 */
export function ConversationDealBar({ conversationId, contactId }: ConversationDealBarProps) {
  const { addToast } = useToast();
  const { data: deals = [] } = useDealsView();
  const { data: boards = [] } = useBoards();
  const { data: lifecycleStages = [] } = useLifecycleStages();

  const deal = useMemo(() => pickContactDeal(deals, contactId), [deals, contactId]);
  const board = useMemo(() => boards.find((b) => b.id === deal?.boardId) ?? null, [boards, deal?.boardId]);
  const { moveDeal } = useMoveDealSimple(board, lifecycleStages);

  const [moving, setMoving] = useState(false);
  const [pendingLostStageId, setPendingLostStageId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const summary = useMutation({ mutationFn: () => summarizeConversation(conversationId) });

  // Outra conversa: o resumo da anterior não vale mais.
  useEffect(() => {
    setShowSummary(false);
    summary.reset();
  }, [conversationId]);

  const stages = board?.stages ?? [];

  const doMove = async (stageId: string, lossReason?: string) => {
    if (!deal) return;
    setMoving(true);
    try {
      await moveDeal(deal, stageId, lossReason);
      const label = stages.find((s) => s.id === stageId)?.label ?? 'nova etapa';
      addToast(`Movido para ${label}`, 'success');
    } catch {
      addToast('Não foi possível mudar a etapa.', 'error');
    } finally {
      setMoving(false);
    }
  };

  const handleStageChange = (stageId: string) => {
    if (!deal || !board || stageId === deal.status) return;
    const target = stages.find((s) => s.id === stageId);
    const isLost = board.lostStageId === stageId || target?.linkedLifecycleStage === 'OTHER';
    if (isLost) {
      setPendingLostStageId(stageId);
      return;
    }
    void doMove(stageId);
  };

  const openSummary = () => {
    setShowSummary(true);
    if (!summary.data && !summary.isPending) summary.mutate();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-hairline)] bg-[var(--surface-card)] px-4 py-2">
        {deal && board ? (
          <>
            <label className="sr-only" htmlFor={`stage-${conversationId}`}>Etapa no Kanban</label>
            <span className="text-[13px] text-[var(--text-secondary)]">Etapa</span>
            <select
              id={`stage-${conversationId}`}
              value={deal.status}
              disabled={moving}
              onChange={(e) => handleStageChange(e.target.value)}
              className={`${PILL} pr-2 font-medium`}
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            {moving ? <Loader2 size={14} className="animate-spin text-[var(--text-tertiary)]" aria-label="Movendo" /> : null}
            <Link href={`/boards?deal=${deal.id}`} className="inline-flex items-center gap-1 text-[13px] text-[var(--text-accent)] hover:underline">
              Abrir negócio <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <span className="text-[13px] text-[var(--text-tertiary)]">
            {contactId ? 'Este contato ainda não tem negócio no Kanban.' : 'Vincule um contato para ver a etapa no Kanban.'}
          </span>
        )}

        <button type="button" onClick={openSummary} className={`${PILL} ml-auto`}>
          <Sparkles size={14} aria-hidden="true" className="text-[var(--text-accent)]" />
          Resumo
        </button>
      </div>

      {showSummary ? (
        <div className="border-b border-[var(--border-hairline)] bg-[var(--surface-sunken)] px-4 py-3">
          <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-3">
            <Sparkles size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--text-accent)]" />
            <div className="min-w-0 flex-1 text-sm text-[var(--text-primary)]">
              <div className="mb-1 text-[13px] font-semibold">Resumo da conversa</div>
              {summary.isPending ? (
                <p className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Lendo a conversa…
                </p>
              ) : summary.isError ? (
                <p className="text-[var(--status-danger-fg)]">{(summary.error as Error)?.message || 'Não foi possível resumir.'}</p>
              ) : summary.data ? (
                summary.data.resumo.length === 0 ? (
                  <p className="text-[var(--text-secondary)]">Ainda não há mensagens para resumir.</p>
                ) : (
                  <>
                    <ul className="list-disc space-y-0.5 pl-4">
                      {summary.data.resumo.map((linha, i) => <li key={i}>{linha}</li>)}
                    </ul>
                    {summary.data.falta ? (
                      <p className="mt-2 text-[13px]"><span className="font-medium">Falta:</span> {summary.data.falta}</p>
                    ) : null}
                    {summary.data.proximoPasso ? (
                      <p className="mt-2 rounded-[var(--radius-md)] bg-[var(--status-warning-bg)] px-2 py-1 text-[13px] text-[var(--status-warning-fg)]">
                        Próximo passo: {summary.data.proximoPasso}
                      </p>
                    ) : null}
                  </>
                )
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => summary.mutate()}
                disabled={summary.isPending}
                className="rounded-[var(--radius-pill)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] disabled:opacity-50"
                aria-label="Atualizar resumo"
                title="Atualizar resumo"
              >
                <RefreshCw size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setShowSummary(false)}
                className="rounded-[var(--radius-pill)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
                aria-label="Fechar resumo"
                title="Fechar"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <LossReasonModal
        isOpen={pendingLostStageId !== null}
        onClose={() => setPendingLostStageId(null)}
        onConfirm={(reason) => {
          const stageId = pendingLostStageId;
          setPendingLostStageId(null);
          if (stageId) void doMove(stageId, reason);
        }}
        dealTitle={deal?.title}
      />
    </>
  );
}
