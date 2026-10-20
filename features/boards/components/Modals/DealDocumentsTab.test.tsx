import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const downloadFile = vi.fn();
let files: Array<Record<string, unknown>> = [];

vi.mock('@/features/inbox/hooks/useDealFiles', () => ({
  useDealFiles: () => ({
    files,
    isLoading: false,
    downloadFile,
    formatFileSize: (b: number | null) => (b ? `${Math.round(b / 1024)} KB` : '-'),
  }),
}));

import { DealDocumentsTab } from './DealDocumentsTab';

describe('DealDocumentsTab', () => {
  beforeEach(() => {
    downloadFile.mockReset();
    files = [];
  });

  it('mostra mensagem quando não há documentos', () => {
    render(<DealDocumentsTab dealId="d1" />);
    expect(screen.getByText('Nenhum documento recebido ainda.')).toBeTruthy();
  });

  it('lista nome, tamanho e botões ver/baixar', () => {
    files = [{ id: 'f1', deal_id: 'd1', file_name: 'rg.pdf', file_path: 'd1/a.pdf', file_size: 2048, mime_type: 'application/pdf', created_at: '2026-10-01T10:00:00Z', created_by: null }];
    render(<DealDocumentsTab dealId="d1" />);
    expect(screen.getByText('rg.pdf')).toBeTruthy();
    expect(screen.getByText('2 KB')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ver rg.pdf' }));
    fireEvent.click(screen.getByRole('button', { name: 'Baixar rg.pdf' }));
    expect(downloadFile).toHaveBeenCalledTimes(2);
  });
});
