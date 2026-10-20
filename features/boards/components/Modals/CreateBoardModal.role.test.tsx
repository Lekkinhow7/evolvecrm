import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/query/hooks/useLifecycleStagesQuery', () => ({ useLifecycleStages: () => ({ data: [] }) }));
vi.mock('@/lib/query/hooks/useProductsQuery', () => ({ useActiveProducts: () => ({ data: [] }) }));
vi.mock('@/context/ToastContext', () => ({ useToast: () => ({ addToast: vi.fn() }) }));
vi.mock('@/features/settings/components/LifecycleSettingsModal', () => ({ LifecycleSettingsModal: () => null }));
vi.mock('./BoardAIConfigModal', () => ({ BoardAIConfigModal: () => null }));

import { CreateBoardModal } from './CreateBoardModal';
import type { Board } from '@/types';

const board = {
  id: 'b1',
  name: 'Funil',
  template: 'CUSTOM',
  isDefault: false,
  createdAt: 'x',
  stages: [
    { id: 's1', label: 'Primeira', color: 'bg-blue-500', role: 'reuniao_agendada' },
    { id: 's2', label: 'Segunda', color: 'bg-green-500' },
    { id: 's3', label: 'Terceira', color: 'bg-red-500' },
  ],
} as unknown as Board;

function setup(props: Partial<React.ComponentProps<typeof CreateBoardModal>> = {}) {
  const onSave = vi.fn();
  render(
    <CreateBoardModal
      isOpen
      onClose={vi.fn()}
      onSave={onSave}
      editingBoard={board}
      availableBoards={[board]}
      {...props}
    />
  );
  return { onSave };
}

describe('CreateBoardModal papel da etapa', () => {
  it('título em português', () => {
    setup();
    expect(screen.getByText('Configurar funil')).toBeTruthy();
  });

  it('seletor tem as três opções', () => {
    setup();
    const selects = screen.getAllByLabelText('Papel da etapa') as HTMLSelectElement[];
    expect(selects).toHaveLength(3);
    const labels = Array.from(selects[0].options).map((o) => o.textContent);
    expect(labels).toEqual(['Nenhum', 'Reunião agendada', 'Análise de documentos']);
    expect(selects[0].value).toBe('reuniao_agendada');
  });

  it('escolher papel que outra etapa tem tira da outra e grava no save', () => {
    const { onSave } = setup();
    const selects = screen.getAllByLabelText('Papel da etapa') as HTMLSelectElement[];
    fireEvent.change(selects[1], { target: { value: 'reuniao_agendada' } });
    expect(selects[0].value).toBe('');
    fireEvent.change(selects[2], { target: { value: 'analise_documentos' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    const payload = onSave.mock.calls[0][0];
    expect(payload.stages.map((s: any) => s.role)).toEqual([undefined, 'reuniao_agendada', 'analise_documentos']);
  });

  it('focusNewStage abre com etapa nova no fim', () => {
    setup({ focusNewStage: true });
    const names = screen.getAllByPlaceholderText('Nome da etapa') as HTMLInputElement[];
    expect(names).toHaveLength(4);
    expect(document.activeElement).toBe(names[3]);
  });

  it('título de criação', () => {
    setup({ editingBoard: undefined });
    expect(screen.getByText('Novo funil')).toBeTruthy();
  });
});
