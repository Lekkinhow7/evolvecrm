import React from 'react';
import { cn } from '@/lib/utils';
import { PILL_SELECT_CLASS } from '@/components/filters/pillSelectClass';

/**
 * Número de um bloco da Visão geral (dentro de um Panel): rótulo, valor e uma linha de apoio.
 * Neutro de propósito: sem ícone colorido, a cor fica só nos selos.
 */
export function DashboardMetric({
  label,
  value,
  hint,
  aside,
  onClick,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Selo ao lado do valor (ex.: Badge "Atenção") */
  aside?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const content = (
    <>
      <span className="block text-[length:var(--fs-caption)] text-[var(--text-secondary)]">{label}</span>
      <span className="mt-1.5 flex items-center gap-2">
        <span className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-[var(--text-primary)] proportional-nums lining-nums">
          {value}
        </span>
        {aside}
      </span>
      {hint ? <span className="mt-1 block truncate text-xs text-[var(--text-tertiary)]">{hint}</span> : null}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'min-w-0 rounded-[var(--radius-md)] p-1 text-left transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
          className,
        )}
      >
        {content}
      </button>
    );
  }
  return <div className={cn('min-w-0 p-1', className)}>{content}</div>;
}

/** Barra fina dividida em partes (carteira, quem enviou as mensagens, ações da IA). */
export function SplitBar({
  parts,
  label,
}: {
  parts: { label: string; value: number; color: string }[];
  label: string;
}) {
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  return (
    <div className="space-y-2">
      <div
        role="img"
        aria-label={`${label}: ${parts.map((p) => `${p.label} ${p.value}`).join(', ')}`}
        className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--viz-track)]"
      >
        {total > 0
          ? parts.map((p) => (
              <span key={p.label} className="h-full" style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
            ))
          : null}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
        {parts.map((p) => (
          <span key={p.label} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            {p.label} ({p.value.toLocaleString('pt-BR')})
          </span>
        ))}
      </div>
    </div>
  );
}

/** Classe dos seletores do topo e dos blocos (funil, período, vendedor). */
export const DASHBOARD_SELECT_CLASS = PILL_SELECT_CLASS;
