import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/query/hooks/useLifecycleStagesQuery', () => ({ useLifecycleStages: () => ({ data: [] }) }));
vi.mock('@/features/boards/hooks/useBoardsController', () => ({
  isDealRotting: () => false,
  getActivityStatus: () => 'none',
}));

import { KanbanBoard } from './KanbanBoard';

const base = {
  stages: [{ id: 's1', label: 'Nova', color: 'bg-blue-500' }],
  filteredDeals: [],
  draggingId: null,
  handleDragStart: vi.fn(),
  handleDragOver: vi.fn(),
  handleDrop: vi.fn(),
  setSelectedDealId: vi.fn(),
  openActivityMenuId: null,
  setOpenActivityMenuId: vi.fn(),
  handleQuickAddActivity: vi.fn(),
  setLastMouseDownDealId: vi.fn(),
};

describe('KanbanBoard coluna "+ Nova etapa"', () => {
  it('com onAddStage mostra a coluna e chama a função no clique', () => {
    const onAddStage = vi.fn();
    render(<KanbanBoard {...base} onAddStage={onAddStage} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ Nova etapa/ }));
    expect(onAddStage).toHaveBeenCalledTimes(1);
  });

  it('sem onAddStage a coluna não aparece', () => {
    render(<KanbanBoard {...base} />);
    expect(screen.queryByText(/Nova etapa/)).toBeNull();
  });
});
