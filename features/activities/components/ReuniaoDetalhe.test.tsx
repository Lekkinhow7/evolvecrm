import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mutateAsync = vi.fn();
let slotsData: Array<Record<string, string>> = [];
const addToast = vi.fn();
vi.mock('@/context/ToastContext', () => ({ useOptionalToast: () => ({ addToast }) }));
vi.mock('@/lib/query/hooks/useAgendaQuery', () => ({
  useFreeSlots: () => ({
    data: slotsData,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpdateMeeting: () => ({ mutateAsync, isPending: false }),
}));

vi.mock('@/lib/query/hooks/useContactsQuery', () => ({
  useContacts: () => ({ data: [{ id: 'c1', name: 'Maria', phone: '+5511999990000' }, { id: 'c2', name: 'Sem Fone', phone: '' }] }),
}));
vi.mock('@/lib/query/hooks/useDealsQuery', () => ({
  useDealsView: () => ({ data: [{ id: 'd1', contactId: 'c1' }, { id: 'd2', contactId: 'c2' }] }),
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
    slotsData = [{ inicio: '2026-10-22T17:00:00.000Z', fim: '2026-10-22T18:00:00.000Z' }];
  });

  it('online mostra o link e o resumo, com as quatro ações', () => {
    render(<ReuniaoDetalhe activity={base} onClose={vi.fn()} />);
    expect(screen.getByRole('link', { name: /meet\.example\.com/ })).toHaveAttribute('href', 'https://meet.example.com/abc');
    expect(screen.getByText('Resumo da conversa')).toBeInTheDocument();
    for (const n of ['Marcar como realizada', 'Não compareceu', 'Remarcar', 'Cancelar reunião']) {
      expect(screen.getByRole('button', { name: n })).toBeInTheDocument();
    }
  });

  it('mostra atalhos para o negócio e para a conversa', () => {
    render(<ReuniaoDetalhe activity={base} onClose={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Abrir negócio' })).toHaveAttribute('href', '/boards?deal=d1');
    const conversa = screen.getByRole('link', { name: 'Abrir conversa' }).getAttribute('href') ?? '';
    expect(conversa).toContain('/messaging?newConversation=true');
    expect(conversa).toContain('contactId=c1');
    expect(conversa).toContain('contactPhone=%2B5511999990000');
  });

  it('sem telefone esconde o atalho da conversa', () => {
    render(<ReuniaoDetalhe activity={{ ...base, dealId: 'd2' }} onClose={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Abrir negócio' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Abrir conversa' })).not.toBeInTheDocument();
  });

  it('não deixa link javascript: clicável', () => {
    render(<ReuniaoDetalhe activity={{ ...base, meetingUrl: 'javascript:alert(1)' }} onClose={vi.fn()} />);
    expect(document.querySelector('a[href^="javascript"]')).toBeNull();
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
        formato: 'online',
        pedido_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      }),
    );
  });

  it('remarcar só mostra horários do formato da reunião', () => {
    slotsData = [
      { inicio: '2026-10-22T17:00:00.000Z', fim: '2026-10-22T18:00:00.000Z', formato: 'presencial' },
      { inicio: '2026-10-22T19:00:00.000Z', fim: '2026-10-22T20:00:00.000Z', formato: 'online' },
    ];
    render(<ReuniaoDetalhe activity={base} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remarcar' }));
    expect(screen.queryByText('14:00')).not.toBeInTheDocument();
    expect(screen.getByText('16:00')).toBeInTheDocument();
  });

  it('remarcação pendente no CRM avisa e fecha', async () => {
    mutateAsync.mockResolvedValue({ ok: true, pendente: true, code: 'MARCADA_SEM_REGISTRO' });
    const onClose = vi.fn();
    render(<ReuniaoDetalhe activity={base} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remarcar' }));
    fireEvent.click(screen.getByText('14:00'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar novo horário' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(addToast).toHaveBeenCalledWith('Reunião remarcada. Ela aparece na agenda em instantes.', 'success');
  });
});
