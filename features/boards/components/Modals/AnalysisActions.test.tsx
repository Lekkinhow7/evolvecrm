import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const moveDeal = vi.fn();
const mutateAsync = vi.fn();

vi.mock('@/lib/query/hooks', () => ({
  useMoveDealSimple: () => ({ moveDeal, isMoving: false }),
  useLifecycleStages: () => ({ data: [] }),
}));
vi.mock('@/lib/query/hooks/useAgendaQuery', () => ({
  usePedirDocumentos: () => ({ mutateAsync, isPending: false }),
}));

import { AnalysisActions } from './AnalysisActions';
import type { Board, DealView } from '@/types';

const board = {
  id: 'b1',
  stages: [
    { id: 's1', label: 'Análise', color: '', role: 'analise_documentos' },
    { id: 's2', label: 'Reunião', color: '', role: 'reuniao_agendada' },
  ],
} as unknown as Board;
const deal = { id: 'd1', status: 's1', awaitingDocuments: false } as unknown as DealView;

describe('AnalysisActions', () => {
  beforeEach(() => {
    moveDeal.mockReset();
    mutateAsync.mockReset();
  });

  it('não aparece fora da etapa de análise', () => {
    const { container } = render(<AnalysisActions deal={{ ...deal, status: 's2' } as DealView} board={board} />);
    expect(container.firstChild).toBeNull();
  });

  it('Seguir para reunião move para a etapa de reunião', () => {
    render(<AnalysisActions deal={deal} board={board} />);
    fireEvent.click(screen.getByRole('button', { name: 'Seguir para reunião' }));
    expect(moveDeal).toHaveBeenCalledWith(deal, 's2');
  });

  it('mostra mensagem quando mover o negócio falha', async () => {
    moveDeal.mockRejectedValue(new Error('x'));
    render(<AnalysisActions deal={deal} board={board} />);
    fireEvent.click(screen.getByRole('button', { name: 'Seguir para reunião' }));
    await waitFor(() => expect(screen.getByText('Não foi possível mover o negócio. Tente de novo.')).toBeTruthy());
  });

  it('sem etapa de reunião, o botão fica desabilitado com dica', () => {
    const semReuniao = { ...board, stages: [board.stages[0]] } as Board;
    render(<AnalysisActions deal={deal} board={semReuniao} />);
    expect((screen.getByRole('button', { name: 'Seguir para reunião' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTitle('Defina a etapa de reunião em Configurar funil')).toBeTruthy();
  });

  it('Não seguir abre o fluxo de perda', () => {
    const onNotFollow = vi.fn();
    render(<AnalysisActions deal={deal} board={board} onNotFollow={onNotFollow} />);
    fireEvent.click(screen.getByRole('button', { name: 'Não seguir' }));
    expect(onNotFollow).toHaveBeenCalled();
  });

  it('Pedir mais documentos com sucesso mostra o selo', async () => {
    mutateAsync.mockResolvedValue({ ok: true });
    render(<AnalysisActions deal={deal} board={board} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pedir mais documentos' }));
    await waitFor(() => expect(screen.getByText('Aguardando documentos')).toBeTruthy());
    expect(mutateAsync).toHaveBeenCalledWith('d1');
  });

  it('Pedir mais documentos com erro mostra mensagem', async () => {
    mutateAsync.mockRejectedValue(new Error('x'));
    render(<AnalysisActions deal={deal} board={board} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pedir mais documentos' }));
    await waitFor(() => expect(screen.getByText('Não foi possível pedir agora. Tente de novo.')).toBeTruthy());
    expect(screen.queryByText('Aguardando documentos')).toBeNull();
  });
});
