import React, { useState } from 'react';
import Image from 'next/image';
import { DealView } from '@/types';
import { Building2 } from 'lucide-react';
import { Badge } from '@/design-system';
import { formatBRL } from '@/lib/utils/brFormat';
import { ActivityStatusIcon } from './ActivityStatusIcon';
import { priorityAriaLabelPtBr } from '@/lib/utils/priority';

interface DealCardProps {
  deal: DealView;
  isRotting: boolean;
  activityStatus: string;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string, title: string) => void;
  /** Callback de seleção do deal (mantido estável via useCallback no pai para permitir memoização) */
  onSelect: (dealId: string) => void;
  /**
   * Performance: boolean derivado por-card evita prop global mutável.
   * Isso reduz re-render em listas grandes quando o usuário abre/fecha o menu.
   */
  isMenuOpen: boolean;
  setOpenMenuId: (id: string | null) => void;
  onQuickAddActivity: (
    dealId: string,
    type: 'CALL' | 'MEETING' | 'EMAIL',
    dealTitle: string
  ) => void;
  setLastMouseDownDealId: (id: string | null) => void;
  /** Callback to open move-to-stage modal for keyboard accessibility */
  onMoveToStage?: (dealId: string) => void;
}

// Check if deal is closed (won or lost)
const isDealClosed = (deal: DealView) => deal.isWon || deal.isLost;

// Get priority label for accessibility (PT-BR)
const getPriorityLabel = (priority: string | undefined) => priorityAriaLabelPtBr(priority);

// Get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const DealCardComponent: React.FC<DealCardProps> = ({
  deal,
  isRotting,
  activityStatus,
  isDragging,
  onDragStart,
  onSelect,
  isMenuOpen,
  setOpenMenuId,
  onQuickAddActivity,
  setLastMouseDownDealId,
  onMoveToStage,
}) => {
  const [localDragging, setLocalDragging] = useState(false);
  const isClosed = isDealClosed(deal);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(isMenuOpen ? null : deal.id);
  };

  const handleQuickAdd = (type: 'CALL' | 'MEETING' | 'EMAIL') => {
    onQuickAddActivity(deal.id, type, deal.title);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setLocalDragging(true);
    e.dataTransfer.setData('dealId', deal.id);
    // Fallback mapping when optimistic temp id gets replaced mid-drag by a refetch.
    // Do not log title; it can contain PII.
    e.dataTransfer.setData('dealTitle', deal.title || '');
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(e, deal.id, deal.title || '');
  };

  const handleDragEnd = () => {
    setLocalDragging(false);
  };

  // Card neutro (design system): a situação aparece nos selos, não na cor do card.
  const dragging = localDragging || isDragging;
  const cardClasses = [
    'group relative cursor-grab select-none rounded-[var(--radius-lg)] border bg-[var(--surface-card)] p-3 shadow-[var(--shadow-sm)] transition-all active:cursor-grabbing',
    'border-[var(--border-hairline)] hover:border-[var(--border-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
    dragging ? 'rotate-1 scale-95 opacity-50' : '',
    deal.isLost && !dragging ? 'opacity-70' : '',
  ].join(' ');
  const hasCompany = Boolean(deal.companyName) && deal.companyName !== 'Sem empresa';
  const highPriority = !isClosed && deal.priority === 'high';

  // Build accessible label including visible text (tags)
  const getAriaLabel = () => {
    const parts: string[] = [];

    // Status badges (visible text)
    if (deal.isWon) parts.push('ganho');
    if (deal.isLost) parts.push('perdido');

    // Tags (visible text) - include all shown tags
    const shownTags = deal.tags.slice(0, isClosed ? 1 : 2);
    if (shownTags.length > 0) {
      parts.push(...shownTags);
    }

    // Main content
    parts.push(deal.title);
    if (deal.companyName) parts.push(deal.companyName);
    parts.push(formatBRL(deal.value));

    // Additional context
    const priority = getPriorityLabel(deal.priority);
    if (priority) parts.push(priority);
    if (isRotting && !isClosed) parts.push('estagnado');

    return parts.join(', ');
  };

  return (
    <div
      data-deal-id={deal.id}
      draggable={!deal.id.startsWith('temp-')}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseDown={() => setLastMouseDownDealId(deal.id)}
      onClick={e => {
        if ((e.target as HTMLElement).closest('button')) return;
        onSelect(deal.id);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!(e.target as HTMLElement).closest('button')) {
            onSelect(deal.id);
          }
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={getAriaLabel()}
      className={cardClasses}
    >
      {(deal.isWon || deal.isLost || (isRotting && !isClosed) || highPriority || deal.tags.length > 0 || deal.documentsCount > 0 || deal.awaitingDocuments) && (
        <div className="mb-2 flex flex-wrap gap-1">
          {deal.isWon && <Badge tone="success">Ganho</Badge>}
          {deal.isLost && (
            <Badge tone="danger">
              <span title={deal.lossReason || undefined}>Perdido</span>
            </Badge>
          )}
          {isRotting && !isClosed && (
            <Badge tone="warning">
              <span title="Mais de 10 dias sem mudar de etapa">Parado</span>
            </Badge>
          )}
          {highPriority && <Badge tone="danger">Prioridade alta</Badge>}
          {deal.documentsCount > 0 && (
            <Badge tone="info">{deal.documentsCount === 1 ? '1 documento' : `${deal.documentsCount} documentos`}</Badge>
          )}
          {deal.awaitingDocuments && <Badge tone="warning">Aguardando documentos</Badge>}
          {deal.tags.slice(0, isClosed ? 1 : 2).map((tag, index) => (
            <Badge key={`${deal.id}-tag-${index}`} tone="neutral">{tag}</Badge>
          ))}
        </div>
      )}

      <h4 className="mb-0.5 text-sm font-medium leading-snug text-[var(--text-primary)]">
        {deal.title}
      </h4>
      {hasCompany && (
        <p className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
          <Building2 size={12} aria-hidden="true" /> {deal.companyName}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-hairline)] pt-2">
        <div className="flex items-center gap-2">
          {deal.owner && deal.owner.name !== 'Sem Dono' && (
            deal.owner.avatar ? (
              <Image
                src={deal.owner.avatar}
                alt={`Responsável: ${deal.owner.name}`}
                width={20}
                height={20}
                className="size-5 rounded-full ring-1 ring-[var(--surface-card)]"
                title={`Responsável: ${deal.owner.name}`}
                unoptimized
              />
            ) : (
              <div
                className="grid size-5 place-items-center rounded-full bg-[var(--surface-muted)] text-[10px] font-semibold text-[var(--text-secondary)] ring-1 ring-[var(--surface-card)]"
                title={`Responsável: ${deal.owner.name}`}
              >
                {getInitials(deal.owner.name)}
              </div>
            )
          )}
          {deal.value > 0 ? (
            <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{formatBRL(deal.value)}</span>
          ) : (
            <span className="text-xs text-[var(--text-quiet)]">Sem valor</span>
          )}
        </div>

        <div className="flex items-center">
          <ActivityStatusIcon
            status={activityStatus}
            type={deal.nextActivity?.type}
            dealId={deal.id}
            dealTitle={deal.title}
            isOpen={isMenuOpen}
            onToggle={handleToggleMenu}
            onQuickAdd={handleQuickAdd}
            onRequestClose={() => setOpenMenuId(null)}
            onMoveToStage={onMoveToStage ? () => onMoveToStage(deal.id) : undefined}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Performance: `DealCard` fica em lista grande (Kanban).
 * Usamos `React.memo` para evitar re-render de TODOS os cards quando apenas o menu de 1 deal muda.
 * Isso depende de props estáveis do pai (ex.: `onSelect` via useCallback e `isMenuOpen` por-card).
 */
export const DealCard = React.memo(DealCardComponent);
