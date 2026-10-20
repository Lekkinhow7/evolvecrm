import React, { useCallback, useMemo, useState } from 'react';
import { DealView, BoardStage } from '@/types';
import { DealCard } from './DealCard';
import { isDealRotting, getActivityStatus } from '@/features/boards/hooks/useBoardsController';
import { MoveToStageModal } from '../Modals/MoveToStageModal';
import { SkeletonDealCard } from '@/components/ui/Skeleton';
import { useLifecycleStages } from '@/lib/query/hooks/useLifecycleStagesQuery';
import { Badge } from '@/design-system';
import { formatBRL } from '@/lib/utils/brFormat';
import { useActivities } from '@/lib/query/hooks/useActivitiesQuery';
import { nextMeetingByDeal } from './dealCardInfo';

/** Barra de rolagem fina com as cores do tema (colunas e quadro). */
const THIN_SCROLL = '[scrollbar-color:var(--border-default)_transparent] [scrollbar-width:thin]';


interface KanbanBoardProps {
  stages: BoardStage[];
  filteredDeals: DealView[];
  draggingId: string | null;
  handleDragStart: (e: React.DragEvent, id: string, title: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, stageId: string) => void;
  setSelectedDealId: (id: string | null) => void;
  openActivityMenuId: string | null;
  setOpenActivityMenuId: (id: string | null) => void;
  handleQuickAddActivity: (
    dealId: string,
    type: 'CALL' | 'MEETING' | 'EMAIL',
    dealTitle: string
  ) => void;
  setLastMouseDownDealId: (id: string | null) => void;
  /** Callback to move a deal to a new stage (for keyboard accessibility) */
  onMoveDealToStage?: (dealId: string, newStageId: string) => void;
  /** Exibe skeleton cards enquanto os dados carregam */
  isLoading?: boolean;
  /** Abre a configuração do funil já com uma etapa nova. Sem ela, a coluna "+ Nova etapa" não aparece. */
  onAddStage?: () => void;
}
/**
 * Componente React `KanbanBoard`.
 *
 * @param {KanbanBoardProps} {
  stages,
  filteredDeals,
  draggingId,
  handleDragStart,
  handleDragOver,
  handleDrop,
  setSelectedDealId,
  openActivityMenuId,
  setOpenActivityMenuId,
  handleQuickAddActivity,
  setLastMouseDownDealId,
  onMoveDealToStage,
} - Parâmetro `{
  stages,
  filteredDeals,
  draggingId,
  handleDragStart,
  handleDragOver,
  handleDrop,
  setSelectedDealId,
  openActivityMenuId,
  setOpenActivityMenuId,
  handleQuickAddActivity,
  setLastMouseDownDealId,
  onMoveDealToStage,
}`.
 * @returns {Element} Retorna um valor do tipo `Element`.
 */
export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stages,
  filteredDeals,
  draggingId,
  handleDragStart,
  handleDragOver,
  handleDrop,
  setSelectedDealId,
  openActivityMenuId,
  setOpenActivityMenuId,
  handleQuickAddActivity,
  setLastMouseDownDealId,
  onMoveDealToStage,
  isLoading = false,
  onAddStage,
}) => {
  const { data: lifecycleStages = [] } = useLifecycleStages();
  // Card: próxima reunião do negócio.
  const { data: activities } = useActivities();
  const nextMeetings = useMemo(() => nextMeetingByDeal(activities ?? []), [activities]);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  
  // State for move-to-stage modal (keyboard accessibility alternative to drag-and-drop)
  const [moveToStageModal, setMoveToStageModal] = useState<{
    isOpen: boolean;
    deal: DealView;
    currentStageId: string;
  } | null>(null);

  /**
   * Performance: o Kanban renderiza listas grandes. Evitamos padrões O(S*N) no render:
   * - Antes: para cada stage, fazia `filteredDeals.filter(...)` + `reduce(...)`.
   * - Agora: agrupamos 1 vez (O(N)) e só lemos por stage (O(S)).
   */
  const dealsByStageId = useMemo(() => {
    const map = new Map<string, DealView[]>();
    const totals = new Map<string, number>();
    for (const deal of filteredDeals) {
      const list = map.get(deal.status);
      if (list) list.push(deal);
      else map.set(deal.status, [deal]);

      totals.set(deal.status, (totals.get(deal.status) ?? 0) + (deal.value ?? 0));
    }
    return { map, totals };
  }, [filteredDeals]);

  // Performance: evita `find` por stage (O(S*L)). Map é O(1) por lookup.
  const lifecycleStageNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const ls of lifecycleStages ?? []) {
      if (ls?.id && ls?.name) map.set(ls.id, ls.name);
    }
    return map;
  }, [lifecycleStages]);

  // Performance: index deals by id once so callbacks can stay stable across menu toggles.
  const dealsById = useMemo(() => new Map(filteredDeals.map((d) => [d.id, d])), [filteredDeals]);

  // Performance: keep selection callback stable so DealCard can be memoized.
  const handleSelectDeal = useCallback(
    (dealId: string) => {
      setSelectedDealId(dealId);
    },
    [setSelectedDealId]
  );

  // Handler to open move-to-stage modal (stable across re-renders when only menu state changes)
  const handleOpenMoveToStage = useCallback(
    (dealId: string) => {
      const deal = dealsById.get(dealId);
      if (deal) {
        setMoveToStageModal({
          isOpen: true,
          deal,
          currentStageId: deal.status,
        });
      }
    },
    [dealsById]
  );

  // Handler to confirm move to a new stage
  const handleConfirmMoveToStage = useCallback((dealId: string, newStageId: string) => {
    if (onMoveDealToStage) {
      onMoveDealToStage(dealId, newStageId);
    }
    setMoveToStageModal(null);
  }, [onMoveDealToStage]);

  return (
    <div role="list" aria-label="Colunas do funil" className={`flex h-full w-full gap-4 overflow-x-auto pb-2 ${THIN_SCROLL}`}>
      {stages.map(stage => {
        const stageDeals = dealsByStageId.map.get(stage.id) ?? [];
        const stageValue = dealsByStageId.totals.get(stage.id) ?? 0;
        const isOver = dragOverStage === stage.id && draggingId !== null;

        // Resolve linked stage name
        const linkedStageName =
          stage.linkedLifecycleStage
            ? lifecycleStageNameById.get(stage.linkedLifecycleStage) ?? null
            : null;

        return (
          <div
            key={stage.id}
            role="listitem"
            aria-label={`Coluna ${stage.label}: ${stageDeals.length} negócio${stageDeals.length !== 1 ? 's' : ''}`}
            onDragOver={(e) => {
              handleDragOver(e);
              setDragOverStage(stage.id);
            }}
            onDrop={(e) => {
              handleDrop(e, stage.id);
              setDragOverStage(null);
            }}
            onDragEnter={() => setDragOverStage(stage.id)}
            onDragLeave={() => setDragOverStage(null)}
            className={`flex h-full max-h-full min-w-[18rem] flex-1 flex-col overflow-visible rounded-[var(--radius-xl)] border transition-colors duration-200 ${
              isOver
                ? 'border-[var(--brand-cyan)] bg-[var(--surface-accent)]'
                : 'border-[var(--border-hairline)] bg-[var(--surface-sunken)]'
            }`}
          >
            <div className="shrink-0 px-4 pb-2 pt-3.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">{stage.label}</h3>
                <Badge tone="neutral">{stageDeals.length.toLocaleString('pt-BR')}</Badge>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[var(--text-tertiary)]">
                <span className="tabular-nums">{formatBRL(stageValue)}</span>
                {linkedStageName ? (
                  <span className="truncate" title={`Quem chega aqui vira ${linkedStageName} nos Contatos`}>
                    Vira {linkedStageName}
                  </span>
                ) : null}
              </div>
            </div>

            <div
              role="list"
              aria-label={`Negócios em ${stage.label}`}
              className={`min-h-[100px] flex-1 space-y-2 overflow-y-auto px-2 pb-2 ${THIN_SCROLL}`}
            >
              {/* Skeleton: exibido durante carregamento inicial */}
              {isLoading && (
                <>
                  <SkeletonDealCard />
                  <SkeletonDealCard />
                </>
              )}

              {/* Empty column state */}
              {!isLoading && stageDeals.length === 0 && !isOver && (
                <div className="mx-1 select-none rounded-[var(--radius-lg)] border border-dashed border-[var(--border-dashed)] px-3 py-6 text-center text-xs text-[var(--text-tertiary)]">
                  Nenhum negócio aqui. Arraste um card para esta etapa.
                </div>
              )}

              {/* Drop target indicator */}
              {isOver && stageDeals.length === 0 && (
                <div className="pointer-events-none flex h-full items-center justify-center py-8 text-sm font-medium text-[var(--text-accent)]">
                  Solte aqui
                </div>
              )}

              {!isLoading && stageDeals.map(deal => (
                <div key={deal.id} role="listitem">
                  <DealCard
                    deal={deal}
                    isRotting={
                      isDealRotting(deal) &&
                      !deal.isWon &&
                      !deal.isLost
                    }
                    activityStatus={getActivityStatus(deal)}
                    isDragging={draggingId === deal.id}
                    onDragStart={handleDragStart}
                    onSelect={handleSelectDeal}
                    // Performance: avoid passing openMenuId (string) to all cards.
                    // Only 1–2 cards will flip `isMenuOpen` when the menu is toggled.
                    isMenuOpen={openActivityMenuId === deal.id}
                    setOpenMenuId={setOpenActivityMenuId}
                    onQuickAddActivity={handleQuickAddActivity}
                    setLastMouseDownDealId={setLastMouseDownDealId}
                    onMoveToStage={onMoveDealToStage ? handleOpenMoveToStage : undefined}
                    nextMeetingAt={nextMeetings.get(deal.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {onAddStage ? (
        <div role="listitem" className="flex h-full min-w-[12rem] shrink-0 flex-col">
          <button
            type="button"
            onClick={onAddStage}
            className="flex w-full items-start justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--border-dashed)] px-4 py-3.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-cyan)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            + Nova etapa
          </button>
        </div>
      ) : null}

      {/* Keyboard-accessible modal for moving deals between stages */}
      {moveToStageModal && (
        <MoveToStageModal
          isOpen={moveToStageModal.isOpen}
          onClose={() => setMoveToStageModal(null)}
          onMove={handleConfirmMoveToStage}
          deal={moveToStageModal.deal}
          stages={stages}
          currentStageId={moveToStageModal.currentStageId}
        />
      )}
    </div>
  );
};
