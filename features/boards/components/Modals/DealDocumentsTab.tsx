import React from 'react';
import { Button } from '@/design-system';
import { useDealFiles } from '@/features/inbox/hooks/useDealFiles';

interface DealDocumentsTabProps {
  dealId: string;
}

/** Documentos que o cliente enviou pelo WhatsApp para este negócio. */
export const DealDocumentsTab: React.FC<DealDocumentsTabProps> = ({ dealId }) => {
  const { files, isLoading, viewFile, downloadFile, formatFileSize } = useDealFiles(dealId);

  if (isLoading) {
    return <p className="text-sm text-[var(--text-secondary)]">Carregando documentos...</p>;
  }

  if (files.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">Nenhum documento recebido ainda.</p>;
  }

  return (
    <ul className="divide-y divide-[var(--border-hairline)] rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--surface-card)]">
      {files.map((file) => (
        <li key={file.id} className="flex items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">{file.file_name}</p>
            <p className="text-xs text-[var(--text-secondary)]">{formatFileSize(file.file_size)}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="secondary" icon="eye" onClick={() => void viewFile(file)} aria-label={`Ver ${file.file_name}`}>
              Ver
            </Button>
            <Button size="sm" variant="outline" icon="download" onClick={() => void downloadFile(file)} aria-label={`Baixar ${file.file_name}`}>
              Baixar
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
};
