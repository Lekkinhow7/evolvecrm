import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityFormModal } from './ActivityFormModal';
import type { Activity, Deal } from '@/types';

const formData = { title: '', type: 'TASK' as Activity['type'], date: '', time: '', description: '', dealId: 'd1' };
const deals = [{ id: 'd1', title: 'Casa Azul' }] as unknown as Deal[];

describe('ActivityFormModal: tipo Reunião', () => {
  it('atividade nova: escolher Reunião troca para a marcação com o negócio escolhido', () => {
    const onEscolherReuniao = vi.fn();
    const setFormData = vi.fn();
    render(
      <ActivityFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        formData={formData}
        setFormData={setFormData}
        editingActivity={null}
        deals={deals}
        onEscolherReuniao={onEscolherReuniao}
      />,
    );
    fireEvent.change(screen.getByDisplayValue('Tarefa'), { target: { value: 'MEETING' } });
    expect(onEscolherReuniao).toHaveBeenCalledWith('d1');
    expect(setFormData).not.toHaveBeenCalled();
  });

  it('sem negócio escolhido passa undefined', () => {
    const onEscolherReuniao = vi.fn();
    render(
      <ActivityFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        formData={{ ...formData, dealId: '' }}
        setFormData={vi.fn()}
        editingActivity={null}
        deals={deals}
        onEscolherReuniao={onEscolherReuniao}
      />,
    );
    fireEvent.change(screen.getByDisplayValue('Tarefa'), { target: { value: 'MEETING' } });
    expect(onEscolherReuniao).toHaveBeenCalledWith(undefined);
  });

  it('outros tipos continuam no formulário', () => {
    const onEscolherReuniao = vi.fn();
    const setFormData = vi.fn();
    render(
      <ActivityFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        formData={formData}
        setFormData={setFormData}
        editingActivity={null}
        deals={deals}
        onEscolherReuniao={onEscolherReuniao}
      />,
    );
    fireEvent.change(screen.getByDisplayValue('Tarefa'), { target: { value: 'CALL' } });
    expect(onEscolherReuniao).not.toHaveBeenCalled();
    expect(setFormData).toHaveBeenCalledWith(expect.objectContaining({ type: 'CALL' }));
  });
});
