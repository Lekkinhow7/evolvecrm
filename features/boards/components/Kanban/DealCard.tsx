import React, { useState } from 'react';
import { isAvatarExpired } from '@/lib/messaging/whatsappAvatar';
import Image from 'next/image';
import { DealView } from '@/types';
import { Building2 } from 'lucide-react';
import { daysInStage, dealSubject, formatMeetingShort, formatPhoneBR } from './dealCardInfo';
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
  /** Próxima reunião marcada (ISO) */
  nextMeetingAt?: string;
}

// Check if deal is closed (won or lost)
const isDealClosed = (deal: DealView) => deal.isWon || deal.isLost;

// Get priority label for accessibility (PT-BR)
const getPriorityLabel = (priority: string | undefined) => priorityAriaLabelPtBr(priority);

// Primeira letra (ou emoji) do nome do cliente, para o avatar
const initialOf = (name: string) => {
  const first = Array.from((name || '').trim())[0];
  return first ? first.toLocaleUpperCase('pt-BR') : '?';
};

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
  nextMeetingAt,
}) => {
  const [localDragging, setLocalDragging] = useState(false);
  // Foto do WhatsApp do cliente; se falhar ao carregar (ou vencida), volta para a inicial.
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(deal.contactAvatar) && !photoFailed && !isAvatarExpired(deal.contactAvatar);
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
  const personName = deal.contactName && deal.contactName !== 'Sem contato' ? deal.contactName : deal.title;
  // Contato sem nome (só o número): mostra o telefone formatado uma vez, como nome.
  const nameIsPhone = /^\+?[\d\s()-]{8,}$/.test(personName);
  const phone = nameIsPhone ? '' : formatPhoneBR(deal.contactPhone);
  const displayName = nameIsPhone ? formatPhoneBR(deal.contactPhone || personName) : personName;
  const subject = dealSubject(deal);
  const stageDays = daysInStage(deal);
  // Origem do lead (primeira etiqueta, ex.: "site") no canto direito, ao lado do assunto.
  const origin = deal.tags[0];
  const originTag = origin ? (
    <span className="shrink-0 rounded-[var(--radius-pill)] bg-[var(--surface-sunken)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
      {origin}
    </span>
  ) : null;
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
      {/* Situação: só o que muda o que fazer com o card */}
      {(deal.isWon || deal.isLost || (isRotting && !isClosed) || highPriority) && (
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
        </div>
      )}

      {/* Quem é */}
      <div className="flex items-center gap-2.5">
        {showPhoto ? (
          <Image
            src={deal.contactAvatar!}
            alt=""
            width={32}
            height={32}
            unoptimized
            onError={() => setPhotoFailed(true)}
            className="size-8 shrink-0 rounded-full object-cover ring-1 ring-[var(--border-hairline)]"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--surface-accent)] text-[13px] font-semibold text-[var(--text-accent)]"
          >
            {nameIsPhone ? '#' : initialOf(personName)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium leading-snug text-[var(--text-primary)] tabular-nums">{displayName}</h4>
          {phone ? <p className="truncate text-xs text-[var(--text-secondary)] tabular-nums">{phone}</p> : null}
        </div>
        {subject ? null : originTag}
      </div>

      {/* O que quer */}
      {subject ? (
        <div className="mt-2 flex items-start gap-2">
          <p className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-snug text-[var(--text-primary)]">{subject}</p>
          {originTag}
        </div>
      ) : null}
      {hasCompany && (
        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-secondary)]">
          <Building2 size={12} aria-hidden="true" /> {deal.companyName}
        </p>
      )}

      {/* O que falta / próximo passo */}
      {(deal.awaitingDocuments || deal.documentsCount > 0 || nextMeetingAt) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {deal.awaitingDocuments ? (
            <Badge tone="warning" size="sm">Aguardando docs</Badge>
          ) : deal.documentsCount > 0 ? (
            <Badge tone="info" size="sm">{deal.documentsCount === 1 ? '1 doc' : `${deal.documentsCount} docs`}</Badge>
          ) : null}
          {nextMeetingAt ? <Badge tone="active" size="sm">{formatMeetingShort(nextMeetingAt)}</Badge> : null}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-2">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          {deal.value > 0 ? (
            <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{formatBRL(deal.value)}</span>
          ) : (
            <span className="text-[var(--text-quiet)]">Sem honorários</span>
          )}
          {!isClosed ? <span className="truncate">· {stageDays === 1 ? '1 dia' : `${stageDays} dias`}</span> : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
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
