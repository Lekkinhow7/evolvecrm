import React, { useState } from 'react';
import { Badge, Button } from '@/design-system';
import { useLifecycleStages, useMoveDealSimple } from '@/lib/query/hooks';
import { usePedirDocumentos } from '@/lib/query/hooks/useAgendaQuery';
import type { Board, DealView } from '@/types';

interface AnalysisActionsProps {
  deal: DealView;
  board: Board | null;
  /** Abre o fluxo de perda que já existe no negócio. */
  onNotFollow?: () => void;
}

/** Decisão da análise de documentos: seguir, pedir mais documentos ou não seguir. */
export const AnalysisActions: React.FC<AnalysisActionsProps> = ({ deal, board, onNotFollow }) => {
  const { data: lifecycleStages = [] } = useLifecycleStages();
  const { moveDeal, isMoving } = useMoveDealSimple(board, lifecycleStages);
  const pedirDocumentos = usePedirDocumentos();
  const [asked, setAsked] = useState(false);
  const [error, setError] = useState(false);
  const [moveError, setMoveError] = useState(false);

  const currentStage = board?.stages.find((s) => s.id === deal.status);
  if (currentStage?.role !== 'analise_documentos') return null;

  const meetingStage = board?.stages.find((s) => s.role === 'reuniao_agendada');
  const awaiting = deal.awaitingDocuments || asked;

  const handleAsk = async () => {
    setError(false);
    try {
      await pedirDocumentos.mutateAsync(deal.id);
      setAsked(true);
    } catch {
      setError(true);
    }
  };

  const handleFollow = async () => {
    if (!meetingStage || isMoving) return;
    setMoveError(false);
    try {
      await moveDeal(deal, meetingStage.id);
    } catch {
      setMoveError(true);
    }
  };

  return (
    <div className="mb-4 rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span title={meetingStage ? undefined : 'Defina a etapa de reunião em Configurar funil'}>
          <Button
            size="sm"
            variant="primary"
            disabled={!meetingStage || isMoving}
            onClick={() => void handleFollow()}
          >
            Seguir para reunião
          </Button>
        </span>
        <Button size="sm" variant="secondary" disabled={pedirDocumentos.isPending} onClick={() => void handleAsk()}>
          Pedir mais documentos
        </Button>
        <Button size="sm" variant="outline" onClick={onNotFollow}>
          Não seguir
        </Button>
        {awaiting && <Badge tone="warning">Aguardando documentos</Badge>}
      </div>
      {moveError && (
        <p role="alert" className="mt-2 text-xs text-[var(--text-secondary)]">
          Não foi possível mover o negócio. Tente de novo.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-[var(--text-secondary)]">
          Não foi possível pedir agora. Tente de novo.
        </p>
      )}
    </div>
  );
};
