'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Icon, PageHeader, Panel, StatCard } from '@/design-system';
import { useActivities } from '@/lib/query/hooks/useActivitiesQuery';
import { useBoards } from '@/lib/query/hooks/useBoardsQuery';
import { ActivityFeedItem } from './components/ActivityFeedItem';
import { PipelineAlertsModal } from './components/PipelineAlertsModal';
import { AIMetricsSection } from './components/AIMetricsSection';
import { MessagingMetricsSection } from './components/MessagingMetricsSection';
import { DASHBOARD_SELECT_CLASS, DashboardMetric, SplitBar } from './components/DashboardMetric';
import { useDashboardMetrics, PeriodFilter, COMPARISON_LABELS } from './hooks/useDashboardMetrics';
import { formatBRL, formatChange, formatPercent } from './format';
import { PeriodFilterSelect } from '@/components/filters/PeriodFilterSelect';
import { LazyFunnelChart, ChartWrapper } from '@/components/charts';
import { SkeletonStatCard } from '@/components/ui/Skeleton';

/**
 * Visão geral: o comercial do escritório no período e no funil escolhidos.
 * Blocos: números principais, saúde da carteira, mensagens, IA, funil e atividades recentes.
 */
const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { data: activities = [] } = useActivities();
  const { data: boards = [] } = useBoards();
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [showPipelineAlerts, setShowPipelineAlerts] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');

  // Inicializar board selecionado
  useEffect(() => {
    if (!selectedBoardId && boards.length > 0) {
      const defaultB = boards.find(b => b.isDefault) || boards[0];
      setSelectedBoardId(defaultB.id);
    }
  }, [boards, selectedBoardId]);

  const {
    isLoading,
    deals,
    wonDeals,
    wonRevenue,
    winRate,
    pipelineValue,
    funnelData,
    activePercent,
    inactivePercent,
    churnedPercent,
    activeContacts,
    inactiveContacts,
    churnedContacts,
    riskyCount,
    stagnantDealsCount,
    stagnantDealsValue,
    avgLTV,
    changes,
    activeSnapshotDeals,
  } = useDashboardMetrics(period, selectedBoardId);

  const comparison = COMPARISON_LABELS[period];
  const change = (value: number) => `${formatChange(value).text} ${comparison}`;
  const hasAlerts = riskyCount > 0 || stagnantDealsCount > 0;
  // Barras do funil na cor de dados do design system (as cores das etapas ficam no Kanban)
  const funnelBars = funnelData.map((d) => ({ ...d, fill: 'var(--viz-1)' }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Visão geral"
        subtitle="Como está o comercial do escritório no período escolhido."
        actions={
          <>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              aria-label="Funil"
              className={DASHBOARD_SELECT_CLASS}
            >
              {boards.map(board => (
                <option key={board.id} value={board.id}>{board.name}</option>
              ))}
            </select>
            <PeriodFilterSelect value={period} onChange={setPeriod} className={DASHBOARD_SELECT_CLASS} />
            <Button variant="secondary" icon="triangle-alert" onClick={() => setShowPipelineAlerts(true)}>
              Ver alertas{hasAlerts ? <span aria-label="há alertas" className="ml-2 inline-block size-2 rounded-full bg-[var(--status-danger-solid)] align-middle" /> : null}
            </Button>
          </>
        }
      />

      {/* Números principais: um ink (o principal), brancos e um lime (resultado) */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            variant="ink"
            label="Valor em negociação"
            value={formatBRL(pipelineValue)}
            unit={change(changes.pipeline)}
            onClick={() => router.push('/boards')}
          />
          <StatCard
            label="Negócios ativos"
            value={(deals.length - wonDeals.length).toLocaleString('pt-BR')}
            unit={change(changes.deals)}
            onClick={() => router.push('/boards?status=open')}
          />
          <StatCard
            label="Conversão"
            value={formatPercent(winRate)}
            unit={change(changes.winRate)}
            onClick={() => router.push('/reports')}
          />
          <StatCard
            variant="lime"
            label="Receita ganha"
            value={formatBRL(wonRevenue)}
            unit={change(changes.revenue)}
            onClick={() => router.push('/boards?status=won&view=list')}
          />
        </div>
      )}

      {/* Saúde da carteira */}
      <Panel title="Saúde da carteira" subtitle="Clientes ativos, negócios parados e valor médio por cliente.">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-[var(--border-hairline)]">
          <div className="min-w-0 md:pr-6">
            <DashboardMetric
              label="Clientes ativos"
              value={`${activePercent}%`}
              hint={`${activeContacts.length.toLocaleString('pt-BR')} de ${(activeContacts.length + inactiveContacts.length + churnedContacts.length).toLocaleString('pt-BR')} contatos`}
              onClick={() => router.push('/contacts')}
            />
            <div className="mt-3 px-1">
              <SplitBar
                label="Carteira"
                parts={[
                  { label: 'Ativos', value: activeContacts.length, color: 'var(--status-success-solid)' },
                  { label: 'Inativos', value: inactiveContacts.length, color: 'var(--status-warning-solid)' },
                  { label: 'Cancelados', value: churnedContacts.length, color: 'var(--status-danger-solid)' },
                ]}
              />
            </div>
            <span className="sr-only">{`Inativos ${inactivePercent}%, cancelados ${churnedPercent}%`}</span>
          </div>
          <div className="min-w-0 md:px-6">
            <DashboardMetric
              label="Negócios parados"
              value={stagnantDealsCount.toLocaleString('pt-BR')}
              aside={<Badge tone={stagnantDealsCount > 0 ? 'warning' : 'success'}>{stagnantDealsCount > 0 ? 'Atenção' : 'Em dia'}</Badge>}
              hint={`Sem mudar de etapa há mais de 10 dias · ${formatBRL(stagnantDealsValue)} em risco`}
              onClick={() => setShowPipelineAlerts(true)}
            />
          </div>
          <div className="min-w-0 md:pl-6">
            <DashboardMetric
              label="Valor médio por cliente"
              value={formatBRL(avgLTV)}
              hint="Quanto cada cliente ativo já rendeu, em média."
            />
          </div>
        </div>
      </Panel>

      <MessagingMetricsSection period={period} />

      <AIMetricsSection />

      {/* Funil e atividades recentes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Funil" subtitle="Negócios em cada etapa." className="flex min-h-[340px] flex-col">
          <div className="relative min-h-[260px] flex-1">
            <div className="absolute inset-0">
              <ChartWrapper height="100%">
                <LazyFunnelChart data={funnelBars} />
              </ChartWrapper>
            </div>
          </div>
        </Panel>

        <Panel
          title="Atividades recentes"
          subtitle="O que aconteceu por último nos negócios."
          actions={
            <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => router.push('/activities')}>
              Ver todas
            </Button>
          }
          className="lg:col-span-2"
        >
          <div className="max-h-[360px] overflow-y-auto pr-1 [scrollbar-color:var(--border-default)_transparent] [scrollbar-width:thin]">
            {activities.length > 0 ? (
              activities.slice(0, 15).map(activity => (
                <ActivityFeedItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-[var(--text-secondary)]">
                <Icon name="clock" size={28} className="text-[var(--text-quiet)]" />
                Nenhuma atividade ainda. Elas aparecem aqui quando a equipe mexer nos negócios.
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Pipeline Alerts Modal */}
      <PipelineAlertsModal
        isOpen={showPipelineAlerts}
        onClose={() => setShowPipelineAlerts(false)}
        deals={activeSnapshotDeals}
        activities={activities.map(a => ({ dealId: a.dealId, date: a.date, completed: a.completed }))}
        onNavigateToDeal={(dealId) => {
          setShowPipelineAlerts(false);
          router.push(`/pipeline?deal=${dealId}`);
        }}
      />
    </div>
  );
};

export default DashboardPage;
