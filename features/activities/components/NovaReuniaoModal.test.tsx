import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const refetch = vi.fn();
const mutateAsync = vi.fn();
let slotsState: Record<string, unknown> = {};

vi.mock('@/lib/query/hooks/useAgendaQuery', () => ({
  useFreeSlots: () => slotsState,
  useScheduleMeeting: () => ({ mutateAsync, isPending: false }),
}));
const addToast = vi.fn();
vi.mock('@/context/ToastContext', () => ({ useOptionalToast: () => ({ addToast }) }));
vi.mock('@/lib/query/hooks/useDealsQuery', () => ({
  useDealsView: () => ({
    data: [
      { id: 'd1', title: 'Casa Azul', contactName: 'Maria', isWon: false, isLost: false },
      { id: 'd2', title: 'Fechado', contactName: 'Joao', isWon: true, isLost: false },
    ],
  }),
}));

import { NovaReuniaoModal } from './NovaReuniaoModal';

// 20/10/2026 é uma terça-feira; 13:00Z = 10:00 em São Paulo
const SLOTS = [
  { inicio: '2026-10-20T13:00:00.000Z', fim: '2026-10-20T14:00:00.000Z' },
  { inicio: '2026-10-21T13:00:00.000Z', fim: '2026-10-21T14:00:00.000Z' },
];

describe('NovaReuniaoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    slotsState = { data: SLOTS, isLoading: false, isError: false, error: null, refetch };
  });

  it('agrupa os horários livres por dia', () => {
    render(<NovaReuniaoModal open onClose={vi.fn()} dealId="d1" />);
    expect(screen.getByText('Ter, 20/10')).toBeInTheDocument();
    expect(screen.getByText('Qua, 21/10')).toBeInTheDocument();
    expect(screen.getAllByText('10:00')).toHaveLength(2);
  });

  it('avisa quando não há horários', () => {
    slotsState = { data: [], isLoading: false, isError: false, error: null, refetch };
    render(<NovaReuniaoModal open onClose={vi.fn()} dealId="d1" />);
    expect(screen.getByText('Nenhum horário livre nos próximos 14 dias.')).toBeInTheDocument();
  });

  it('mostra erro do n8n e desabilita o botão', () => {
    slotsState = { data: undefined, isLoading: false, isError: true, error: new Error('x'), refetch };
    render(<NovaReuniaoModal open onClose={vi.fn()} dealId="d1" />);
    expect(screen.getByText('Não foi possível falar com a agenda. Tente de novo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marcar reunião' })).toBeDisabled();
  });

  it('confirma com deal_id, inicio, fim e formato', async () => {
    mutateAsync.mockResolvedValue({ ok: true, reuniao_id: 'r1' });
    const onClose = vi.fn();
    render(<NovaReuniaoModal open onClose={onClose} dealId="d1" />);
    fireEvent.click(screen.getAllByText('10:00')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar reunião' }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        deal_id: 'd1',
        inicio: SLOTS[0].inicio,
        fim: SLOTS[0].fim,
        formato: 'online',
        pedido_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(addToast).not.toHaveBeenCalled();
  });

  it('n8n marcou mas o CRM não registrou: avisa que aparece em instantes e fecha', async () => {
    mutateAsync.mockResolvedValue({ ok: true, pendente: true, code: 'MARCADA_SEM_REGISTRO' });
    const onClose = vi.fn();
    render(<NovaReuniaoModal open onClose={onClose} dealId="d1" />);
    fireEvent.click(screen.getAllByText('10:00')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar reunião' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(addToast).toHaveBeenCalledWith('Reunião marcada. Ela aparece na agenda em instantes.', 'success');
  });

  it('repetir depois de falha usa o mesmo pedido_id; nova abertura gera outro', async () => {
    mutateAsync.mockRejectedValueOnce(Object.assign(new Error('fora'), { code: 'N8N_INDISPONIVEL', status: 502 }));
    mutateAsync.mockResolvedValue({ ok: true });
    const { rerender } = render(<NovaReuniaoModal open onClose={vi.fn()} dealId="d1" />);
    fireEvent.click(screen.getAllByText('10:00')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar reunião' }));
    await screen.findByText('Não foi possível falar com a agenda. Tente de novo.');
    fireEvent.click(screen.getAllByText('10:00')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar reunião' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(2));
    const [a, b] = mutateAsync.mock.calls.map((c) => c[0].pedido_id);
    expect(a).toBe(b);
    rerender(<NovaReuniaoModal open={false} onClose={vi.fn()} dealId="d1" />);
    rerender(<NovaReuniaoModal open onClose={vi.fn()} dealId="d1" />);
    fireEvent.click(screen.getAllByText('10:00')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar reunião' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(3));
    expect(mutateAsync.mock.calls[2][0].pedido_id).not.toBe(a);
  });

  it('409 mostra aviso e recarrega a lista', async () => {
    mutateAsync.mockRejectedValue(Object.assign(new Error('ocupado'), { code: 'HORARIO_OCUPADO', status: 409 }));
    render(<NovaReuniaoModal open onClose={vi.fn()} dealId="d1" />);
    fireEvent.click(screen.getAllByText('10:00')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar reunião' }));
    expect(await screen.findByText('Esse horário acabou de ser ocupado. Escolha outro.')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalled();
  });

  it('sem dealId, escolhe entre negócios abertos', async () => {
    mutateAsync.mockResolvedValue({ ok: true, reuniao_id: 'r1' });
    render(<NovaReuniaoModal open onClose={vi.fn()} />);
    expect(screen.queryByText('Fechado')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Casa Azul - Maria'));
    fireEvent.click(screen.getAllByText('10:00')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar reunião' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ deal_id: 'd1' })));
  });
});
