import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mutateAsync = vi.fn();
vi.mock('@/lib/query/hooks/useAgendaQuery', () => ({
  useFreeSlots: () => ({
    data: [{ inicio: '2026-10-22T17:00:00.000Z', fim: '2026-10-22T18:00:00.000Z' }],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpdateMeeting: () => ({ mutateAsync, isPending: false }),
}));

import { ReuniaoDetalhe } from './ReuniaoDetalhe';
import type { Activity } from '@/types';

const base = {
  id: 'a1',
  dealId: 'd1',
  dealTitle: 'Casa Azul',
  type: 'MEETING',
  title: 'Reunião com Maria',
  description: 'Resumo da conversa',
  date: '2026-10-20T13:00:00.000Z',
  endsAt: '2026-10-20T14:00:00.000Z',
  completed: false,
  meetingStatus: 'agendada',
  meetingFormat: 'online',
  meetingUrl: 'https://meet.example.com/abc',
  user: { name: 'Eu', avatar: '' },
} as unknown as Activity;

describe('ReuniaoDetalhe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockResolvedValue({ ok: true });
  });

  it('online mostra o link e o resumo, com as quatro ações', () => {
    render(<ReuniaoDetalhe activity={base} onClose={vi.fn()} />);
    expect(screen.getByRole('link', { name: /meet\.example\.com/ })).toHaveAttribute('href', 'https://meet.example.com/abc');
    expect(screen.getByText('Resumo da conversa')).toBeInTheDocument();
    for (const n of ['Marcar como realizada', 'Não compareceu', 'Remarcar', 'Cancelar reunião']) {
      expect(screen.getByRole('button', { name: n })).toBeInTheDocument();
    }
  });

  it('presencial mostra o endereço', () => {
    render(
      <ReuniaoDetalhe
        activity={{ ...base, meetingFormat: 'presencial', meetingUrl: undefined, address: 'Rua A, 10' }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Rua A, 10')).toBeInTheDocument();
  });

  it('cancelada mostra selo e só o histórico', () => {
    render(<ReuniaoDetalhe activity={{ ...base, meetingStatus: 'cancelada' }} onClose={vi.fn()} />);
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remarcar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar reunião' })).not.toBeInTheDocument();
  });

  it('marcar como realizada envia a ação de status', async () => {
    render(<ReuniaoDetalhe activity={base} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como realizada' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ id: 'a1', acao: 'status', status: 'realizada' }));
  });

  it('cancelar envia a ação cancelar', async () => {
    render(<ReuniaoDetalhe activity={base} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar reunião' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ id: 'a1', acao: 'cancelar' }));
  });

  it('remarcar escolhe novo horário livre', async () => {
    render(<ReuniaoDetalhe activity={base} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remarcar' }));
    fireEvent.click(screen.getByText('14:00'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar novo horário' }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 'a1',
        acao: 'remarcar',
        inicio: '2026-10-22T17:00:00.000Z',
        fim: '2026-10-22T18:00:00.000Z',
      }),
    );
  });
});
