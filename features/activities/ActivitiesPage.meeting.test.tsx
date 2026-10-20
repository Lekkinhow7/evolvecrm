import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Activity } from '@/types';

const handleEditActivity = vi.fn();
const setIsModalOpen = vi.fn();
const setIsMeetingModalOpen = vi.fn();
let meetingOpen = false;

const reuniaoAgenda = { id: 'a1', type: 'MEETING', title: 'Reunião - Maria', externalRef: 'ag-1', date: '2026-10-20T13:00:00.000Z' } as unknown as Activity;
const reuniaoAntiga = { id: 'a2', type: 'MEETING', title: 'Reunião antiga', date: '2026-10-20T13:00:00.000Z' } as unknown as Activity;
const tarefa = { id: 'a3', type: 'TASK', title: 'Ligar', date: '2026-10-20T13:00:00.000Z' } as unknown as Activity;

vi.mock('./hooks/useActivitiesController', () => ({
  useActivitiesController: () => ({
    viewMode: 'list',
    setViewMode: vi.fn(),
    searchTerm: '',
    setSearchTerm: vi.fn(),
    filterType: 'ALL',
    setFilterType: vi.fn(),
    dateFilter: 'ALL',
    currentDate: new Date('2026-10-20T12:00:00Z'),
    setCurrentDate: vi.fn(),
    isModalOpen: false,
    setIsModalOpen,
    isMeetingModalOpen: meetingOpen,
    setIsMeetingModalOpen,
    editingActivity: null,
    formData: { title: '', type: 'TASK', date: '', time: '', description: '', dealId: '' },
    setFormData: vi.fn(),
    filteredActivities: [reuniaoAgenda, reuniaoAntiga, tarefa],
    deals: [],
    contacts: [],
    companies: [],
    handleNewActivity: vi.fn(),
    handleEditActivity,
    handleDeleteActivity: vi.fn(),
    handleToggleComplete: vi.fn(),
    handleSubmit: vi.fn(),
  }),
}));
vi.mock('@/context/ToastContext', () => ({ useToast: () => ({ addToast: vi.fn() }) }));
vi.mock('./components/ActivitiesHeader', () => ({ ActivitiesHeader: () => null }));
vi.mock('./components/ActivitiesFilters', () => ({ ActivitiesFilters: () => null }));
vi.mock('./components/ActivitiesCalendar', () => ({ ActivitiesCalendar: () => null }));
vi.mock('./components/BulkActionsToolbar', () => ({ BulkActionsToolbar: () => null }));
vi.mock('./components/ActivitiesList', () => ({
  ActivitiesList: ({ activities, onEdit }: { activities: Activity[]; onEdit: (a: Activity) => void }) => (
    <div>
      {activities.map((a) => (
        <button key={a.id} onClick={() => onEdit(a)}>
          editar {a.id}
        </button>
      ))}
    </div>
  ),
}));
vi.mock('./components/ActivityFormModal', () => ({
  ActivityFormModal: ({ onEscolherReuniao }: { onEscolherReuniao: (d?: string) => void }) => (
    <button onClick={() => onEscolherReuniao('d9')}>escolher reunião</button>
  ),
}));
vi.mock('./components/NovaReuniaoModal', () => ({
  NovaReuniaoModal: ({ open, dealId }: { open: boolean; dealId?: string }) =>
    open ? <div>nova reunião {dealId ?? 'sem negócio'}</div> : null,
}));
vi.mock('./components/ReuniaoDetalhe', () => ({
  ReuniaoDetalhe: ({ activity }: { activity: Activity }) => <div>detalhe {activity.id}</div>,
}));

import { ActivitiesPage } from './ActivitiesPage';

describe('ActivitiesPage: reuniões da agenda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meetingOpen = false;
  });

  it('editar reunião com agendamento abre o ReuniaoDetalhe, não o formulário', () => {
    render(<ActivitiesPage />);
    fireEvent.click(screen.getByText('editar a1'));
    expect(screen.getByText('detalhe a1')).toBeInTheDocument();
    expect(handleEditActivity).not.toHaveBeenCalled();
  });

  it('reunião sem agendamento e tarefa seguem no formulário genérico', () => {
    render(<ActivitiesPage />);
    fireEvent.click(screen.getByText('editar a2'));
    fireEvent.click(screen.getByText('editar a3'));
    expect(handleEditActivity).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/^detalhe/)).not.toBeInTheDocument();
  });

  it('tipo Reunião no formulário novo fecha o formulário e abre a marcação com o negócio', () => {
    const { rerender } = render(<ActivitiesPage />);
    fireEvent.click(screen.getByText('escolher reunião'));
    expect(setIsModalOpen).toHaveBeenCalledWith(false);
    expect(setIsMeetingModalOpen).toHaveBeenCalledWith(true);
    meetingOpen = true;
    rerender(<ActivitiesPage />);
    expect(screen.getByText('nova reunião d9')).toBeInTheDocument();
  });
});
