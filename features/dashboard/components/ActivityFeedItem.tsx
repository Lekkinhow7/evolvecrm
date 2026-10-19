import React from 'react';
import { Icon } from '@/design-system';
import { Activity } from '@/types';

interface ActivityFeedItemProps {
    activity: Activity;
}

// Performance: reuse Intl formatter instead of instantiating options object per render.
const ACTIVITY_FEED_DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
});

/** Ícone por tipo de atividade. Monocromático: o tipo se lê pelo desenho, não pela cor. */
const TYPE_ICON: Record<string, string> = {
    CALL: 'phone',
    EMAIL: 'mail',
    MEETING: 'calendar',
    TASK: 'circle-check',
    NOTE: 'sticky-note',
    STATUS_CHANGE: 'arrow-right-left',
};

/**
 * Linha do feed "Atividades recentes" da Visão geral.
 *
 * @param {ActivityFeedItemProps} { activity } - Parâmetro `{ activity }`.
 * @returns {Element} Retorna um valor do tipo `Element`.
 */
export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({ activity }) => {
    // Smart Icon Logic: Corrigir visualmente inconsistências de dados legados/seed
    const titleLower = activity.title.toLowerCase();
    const visualType =
        titleLower.includes('call') || titleLower.includes('ligação')
            ? 'CALL'
            : titleLower.includes('email')
              ? 'EMAIL'
              : titleLower.includes('reunião') || titleLower.includes('meeting') || titleLower.includes('demo')
                ? 'MEETING'
                : activity.type;

    // Formatar data relativa ou absoluta melhorada
    const formattedDate = ACTIVITY_FEED_DATE_FORMATTER.format(new Date(activity.date));

    return (
        <div className="flex items-start gap-3 border-b border-[var(--border-hairline)] px-1 py-3 last:border-0">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)]">
                <Icon name={TYPE_ICON[visualType] ?? 'circle-alert'} size={15} />
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {activity.title}
                </p>
                {activity.dealTitle && (
                    <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                        em <span className="font-medium text-[var(--text-primary)]">{activity.dealTitle}</span>
                    </p>
                )}
                {activity.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-[var(--text-tertiary)]">
                        {activity.description}
                    </p>
                )}
            </div>
            <span className="whitespace-nowrap text-xs text-[var(--text-tertiary)] tabular-nums">
                {formattedDate}
            </span>
        </div>
    );
};
