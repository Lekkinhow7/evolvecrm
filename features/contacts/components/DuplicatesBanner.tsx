'use client';

import React from 'react';
import { Button, Icon } from '@/design-system';

interface DuplicatesBannerProps {
  count: number;
  onResolve: () => void;
}

/** Aviso discreto de contatos duplicados, com o atalho para juntar. */
export const DuplicatesBanner: React.FC<DuplicatesBannerProps> = ({ count, onResolve }) => {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--surface-card)] px-4 py-3">
      <Icon name="copy" size={18} className="shrink-0 text-[var(--status-warning-fg)]" />
      <p className="min-w-0 flex-1 text-sm text-[var(--text-secondary)]">
        <span className="font-medium text-[var(--text-primary)]">
          {count} {count === 1 ? 'grupo de contatos duplicados' : 'grupos de contatos duplicados'}.
        </span>{' '}
        Mesmo telefone ou e-mail: dá para juntar em um só.
      </p>
      <Button variant="secondary" size="sm" icon="git-merge" onClick={onResolve}>
        Juntar duplicados
      </Button>
    </div>
  );
};
