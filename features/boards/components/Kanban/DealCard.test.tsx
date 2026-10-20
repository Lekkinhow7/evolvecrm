import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DealCard } from './DealCard';
import type { DealView } from '@/types';

vi.mock('./ActivityStatusIcon', () => ({ ActivityStatusIcon: () => null }));

const base = {
  id: 'd1', title: 'Caso', value: 0, tags: [], companyName: '', isWon: false, isLost: false,
  priority: 'medium', documentsCount: 0, awaitingDocuments: false,
} as unknown as DealView;

const renderCard = (over: Partial<DealView>) =>
  render(
    <DealCard
      deal={{ ...base, ...over } as DealView}
      isRotting={false}
      activityStatus="none"
      isDragging={false}
      onDragStart={vi.fn()}
      onSelect={vi.fn()}
      isMenuOpen={false}
      setOpenMenuId={vi.fn()}
      onQuickAddActivity={vi.fn()}
      setLastMouseDownDealId={vi.fn()}
    />,
  );

describe('DealCard selos de documentos', () => {
  it('mostra "3 docs"', () => {
    renderCard({ documentsCount: 3 });
    expect(screen.getByText('3 docs')).toBeTruthy();
  });
  it('singular com 1 documento', () => {
    renderCard({ documentsCount: 1 });
    expect(screen.getByText('1 doc')).toBeTruthy();
  });
  it('mostra "Aguardando docs"', () => {
    renderCard({ awaitingDocuments: true });
    expect(screen.getByText('Aguardando docs')).toBeTruthy();
  });
  it('sem documentos não mostra selos', () => {
    renderCard({});
    expect(screen.queryByText(/docs?/)).toBeNull();
  });
});
