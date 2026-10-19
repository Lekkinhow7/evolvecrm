/**
 * @fileoverview AI Metrics Section
 *
 * Bloco "Assistente de IA" da Visão geral: conversas, aprovações pendentes,
 * taxa de aprovação e avanços automáticos.
 *
 * @module features/dashboard/components/AIMetricsSection
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Icon, Panel } from '@/design-system';
import { useAIMetricsQuery } from '@/lib/query/hooks';
import { formatPercent } from '../format';
import { DashboardMetric, SplitBar } from './DashboardMetric';

const GRID = 'grid grid-cols-2 gap-4 lg:grid-cols-4';

export function AIMetricsSection() {
  const router = useRouter();
  const { data, isLoading, error } = useAIMetricsQuery();

  if (error) {
    return null; // Silently hide on error
  }

  const title = 'Assistente de IA';
  const subtitle = 'O que a IA fez nas conversas deste mês.';

  if (isLoading) {
    return (
      <Panel title={title} subtitle={subtitle}>
        <div className={GRID}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-muted)]" />
          ))}
        </div>
      </Panel>
    );
  }

  if (!data || data.conversations.thisMonth.total === 0) {
    return (
      <Panel title={title} subtitle={subtitle}>
        <div className="flex flex-wrap items-center gap-3">
          <Icon name="sparkles" size={20} className="text-[var(--text-quiet)]" />
          <p className="flex-1 text-sm text-[var(--text-secondary)]">
            A IA ainda não atendeu nenhuma conversa. Ative o assistente nas configurações para ele responder os contatos.
          </p>
          <Button variant="secondary" size="sm" icon="settings" onClick={() => router.push('/settings?tab=ai')}>
            Configurar a IA
          </Button>
        </div>
      </Panel>
    );
  }

  const { conversations, hitl, tokensUsed } = data;
  const monthStats = conversations.thisMonth;

  return (
    <Panel
      title={title}
      subtitle={subtitle}
      meta={<Badge tone="neutral">{tokensUsed.thisMonth.toLocaleString('pt-BR')} tokens</Badge>}
    >
      <div className={GRID}>
        <DashboardMetric
          label="Conversas hoje"
          value={conversations.today.total.toLocaleString('pt-BR')}
          hint={`${conversations.thisWeek.total} nesta semana`}
        />
        <DashboardMetric
          label="Aprovações pendentes"
          value={hitl.pending.toLocaleString('pt-BR')}
          aside={hitl.pending > 0 ? <Badge tone="warning">Revisar</Badge> : null}
          hint={hitl.pending > 0 ? 'Esperando alguém aprovar' : 'Nada para aprovar'}
          onClick={() => router.push('/settings?tab=ai')}
        />
        <DashboardMetric
          label="Taxa de aprovação"
          value={formatPercent(hitl.approvalRate)}
          hint={`${hitl.approved} aprovadas, ${hitl.rejected} recusadas`}
        />
        <DashboardMetric
          label="Avanços automáticos"
          value={monthStats.advancedStage.toLocaleString('pt-BR')}
          hint={`${hitl.autoApproved} sem precisar de aprovação`}
        />
      </div>

      <div className="mt-5 border-t border-[var(--border-hairline)] pt-4">
        <div className="mb-2 flex justify-between text-[length:var(--fs-caption)] text-[var(--text-secondary)]">
          <span>Ações no mês</span>
          <span>{monthStats.total.toLocaleString('pt-BR')} no total</span>
        </div>
        <SplitBar
          label="Ações no mês"
          parts={[
            { label: 'Respondeu', value: monthStats.responded, color: 'var(--viz-1)' },
            { label: 'Avançou etapa', value: monthStats.advancedStage, color: 'var(--viz-2)' },
            { label: 'Passou para a equipe', value: monthStats.handoff, color: 'var(--viz-4)' },
            { label: 'Não agiu', value: monthStats.skipped, color: 'var(--border-strong)' },
          ]}
        />
      </div>
    </Panel>
  );
}
