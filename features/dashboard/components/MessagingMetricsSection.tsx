/**
 * @fileoverview Messaging Metrics Section
 *
 * Bloco "Mensagens" da Visão geral: mensagens enviadas, novos contatos,
 * tempo da 1ª resposta e taxa de resposta, com filtro por vendedor.
 *
 * @module features/dashboard/components/MessagingMetricsSection
 */

import React, { useState } from 'react';
import { Icon, Panel } from '@/design-system';
import { useMessagingMetricsQuery, useOrgMembersQuery } from '@/lib/query/hooks';
import type { PeriodFilter } from '../hooks/useDashboardMetrics';
import { formatPercent } from '../format';
import { DASHBOARD_SELECT_CLASS, DashboardMetric, SplitBar } from './DashboardMetric';

// =============================================================================
// Helpers
// =============================================================================

export function formatSeconds(seconds: number): string {
  if (seconds === 0) return '--';
  if (seconds < 60) return '< 1min';
  if (seconds < 3600) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return sec > 0 ? `${min}min ${sec}s` : `${min}min`;
  }
  const hours = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  return min > 0 ? `${hours}h ${min}min` : `${hours}h`;
}

const GRID = 'grid grid-cols-2 gap-4 lg:grid-cols-4';

// =============================================================================
// Main Section
// =============================================================================

export function MessagingMetricsSection({ period }: { period: PeriodFilter }) {
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const userId = selectedUserId === 'all' ? undefined : selectedUserId;

  const { data, isLoading, error } = useMessagingMetricsQuery(period, userId);
  const { data: members = [] } = useOrgMembersQuery();

  if (error) {
    return null;
  }

  const sellerSelect = members.length > 1 ? (
    <select
      value={selectedUserId}
      onChange={(e) => setSelectedUserId(e.target.value)}
      aria-label="Filtrar por vendedor"
      className={DASHBOARD_SELECT_CLASS}
    >
      <option value="all">Todos os vendedores</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  ) : null;

  const title = 'Mensagens';
  const subtitle = 'Atendimento pelos canais conectados no período.';

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

  if (!data || data.messagesSent.total === 0) {
    return (
      <Panel title={title} subtitle={subtitle} actions={sellerSelect}>
        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
          <Icon name="inbox" size={20} className="text-[var(--text-quiet)]" />
          Nenhuma mensagem neste período. Os números aparecem quando o sistema enviar mensagens.
        </div>
      </Panel>
    );
  }

  const { messagesSent, contacts, sla, responseRate } = data;
  const humanCount = messagesSent.byType.user ?? 0;
  const aiCount = (messagesSent.byType.ai ?? 0) + (messagesSent.byType.agent ?? 0);
  const systemCount = messagesSent.byType.system ?? 0;
  const unknownCount = messagesSent.byType.unknown ?? 0;

  return (
    <Panel title={title} subtitle={subtitle} actions={sellerSelect}>
      <div className={GRID}>
        <DashboardMetric
          label="Mensagens enviadas"
          value={messagesSent.total.toLocaleString('pt-BR')}
          hint={`${humanCount} pela equipe, ${aiCount} pela IA`}
        />
        <DashboardMetric
          label="Novos contatos"
          value={contacts.new.toLocaleString('pt-BR')}
          hint={`${contacts.followUp} retornos`}
        />
        <DashboardMetric
          label="Tempo da 1ª resposta"
          value={formatSeconds(sla.avgFirstResponseSeconds)}
          hint={`${sla.conversationsWithFRT} conversas medidas`}
        />
        <DashboardMetric
          label="Taxa de resposta"
          value={formatPercent(responseRate.rate)}
          hint={`${responseRate.responded} de ${responseRate.total} conversas`}
        />
      </div>

      <div className="mt-5 border-t border-[var(--border-hairline)] pt-4">
        <div className="mb-2 text-[length:var(--fs-caption)] text-[var(--text-secondary)]">Quem enviou</div>
        <SplitBar
          label="Quem enviou"
          parts={[
            { label: 'Equipe', value: humanCount, color: 'var(--viz-2)' },
            { label: 'IA', value: aiCount, color: 'var(--viz-1)' },
            ...(systemCount > 0 ? [{ label: 'Sistema', value: systemCount, color: 'var(--viz-6)' }] : []),
            ...(unknownCount > 0 ? [{ label: 'Sem autor', value: unknownCount, color: 'var(--border-strong)' }] : []),
          ]}
        />
      </div>
    </Panel>
  );
}
