'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Badge, Button, Icon, PageHeader, Panel, ProgressBar, StatCard } from '@/design-system';
import { PILL_SELECT_CLASS } from '@/components/filters/pillSelectClass';
import { formatBRL, formatBRLShort, formatChange, formatPercent } from '@/lib/utils/brFormat';
import { useDashboardMetrics, PeriodFilter, COMPARISON_LABELS } from '../dashboard/hooks/useDashboardMetrics';
import { PeriodFilterSelect } from '@/components/filters/PeriodFilterSelect';
import { LazyRevenueTrendChart, ChartWrapper } from '@/components/charts';
import { generateReportPDF } from './utils/generateReportPDF';
import { useBoards } from '@/lib/query/hooks';
import { useAuth } from '@/context/AuthContext';

/**
 * Componente React `ReportsPage`.
 * @returns {Element} Retorna um valor do tipo `Element`.
 */
const ReportsPage: React.FC = () => {
  const router = useRouter();
  const { data: boards = [] } = useBoards();
  const { profile } = useAuth();
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');

  // Performance: avoid recomputing the "default board id" logic inside the effect.
  const defaultBoardId = useMemo(() => {
    if (!boards.length) return '';
    const defaultB = boards.find(b => b.isDefault) || boards[0];
    return defaultB?.id || '';
  }, [boards]);

  // Inicializar board selecionado
  useEffect(() => {
    if (!selectedBoardId && defaultBoardId) {
      setSelectedBoardId(defaultBoardId);
    }
  }, [defaultBoardId, selectedBoardId]);

  // Pegar o board selecionado para acessar a meta
  const selectedBoard = useMemo(() => {
    return boards.find(b => b.id === selectedBoardId);
  }, [boards, selectedBoardId]);

  const {
    trendData,
    avgSalesCycle,
    fastestDeal,
    slowestDeal,
    wonDealsWithDates,
    actualWinRate,
    wonDeals,
    lostDeals,
    topLossReasons,
    topDeals,
    wonRevenue,
    pipelineValue,
    deals,
    changes,
    funnelData,
  } = useDashboardMetrics(period, selectedBoardId);

  // Extrair meta do board selecionado
  const boardGoal = selectedBoard?.goal;
  const goalType = boardGoal?.type || 'currency';
  const goalTarget = parseFloat(boardGoal?.targetValue || '0') || 0;
  const goalKpi = boardGoal?.kpi || 'Receita';
  const hasGoal = goalTarget > 0;

  // Calcular valor atual baseado no tipo de meta (PADRÃO HUBSPOT/SALESFORCE)
  // Usa dados DO PERÍODO selecionado, não o total histórico
  const currentValue = React.useMemo(() => {
    switch (goalType) {
      case 'currency':
        // Receita GANHA no período
        return wonRevenue;
      case 'percentage':
        // Taxa de conversão do período
        return actualWinRate;
      case 'number':
      default:
        // Quantidade de deals GANHOS no período
        return wonDeals.length;
    }
  }, [goalType, wonRevenue, actualWinRate, wonDeals.length]);

  // Calcular Forecast
  const forecastPercent = hasGoal ? Math.min((currentValue / goalTarget) * 100, 100) : 0;
  const forecastGap = goalTarget - currentValue;
  const isOnTrack = forecastPercent >= 75;

  // Formatador baseado no tipo
  // Performance: keep formatter stable (prevents unnecessary child rerenders when passed down).
  const formatGoalValue = useCallback((value: number) => {
    switch (goalType) {
      case 'currency':
        return formatBRL(value);
      case 'number':
        return value.toFixed(0);
      case 'percentage':
        return formatPercent(value);
      default:
        return value.toLocaleString();
    }
  }, [goalType]);

  // Calcular Performance por Vendedor (Leaderboard)
  const leaderboard = React.useMemo(() => {
    const repsMap: Record<string, { name: string; avatar: string; deals: number; revenue: number; winRate: number }> = {};

    wonDeals.forEach(deal => {
      const ownerKey = deal.owner?.name || 'unknown';
      const ownerName = deal.owner?.name || 'Sem Dono';
      const ownerAvatar = deal.owner?.avatar || '';

      if (!repsMap[ownerKey]) {
        repsMap[ownerKey] = { name: ownerName, avatar: ownerAvatar, deals: 0, revenue: 0, winRate: 0 };
      }
      repsMap[ownerKey].deals += 1;
      repsMap[ownerKey].revenue += deal.value;
    });

    return Object.entries(repsMap)
      .map(([id, data]) => ({
        id,
        ...data,
        winRate: data.deals > 0 ? Math.round((data.deals / Math.max(data.deals, 1)) * 100) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [wonDeals]);


  const generatedBy = useMemo(() => {
    if (profile?.first_name && profile?.last_name) return `${profile.first_name} ${profile.last_name}`;
    return profile?.first_name || profile?.email || 'Usuário';
  }, [profile?.email, profile?.first_name, profile?.last_name]);

  const handleExportPDF = useCallback(async () => {
    // generateReportPDF usa dynamic imports para carregar jsPDF apenas quando necessário
    await generateReportPDF(
      {
        pipelineValue,
        actualWinRate,
        avgSalesCycle,
        fastestDeal,
        wonRevenue,
        wonDeals,
        changes,
        funnelData,
      },
      period,
      selectedBoard?.name,
      generatedBy
    );
  }, [
    actualWinRate,
    avgSalesCycle,
    changes,
    fastestDeal,
    funnelData,
    generatedBy,
    period,
    pipelineValue,
    selectedBoard?.name,
    wonDeals,
    wonRevenue,
  ]);

  const comparison = COMPARISON_LABELS[period];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Relatórios"
        subtitle="Resultados do funil no período: meta, conversão, tempo de fechamento e receita."
        actions={
          <>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              aria-label="Funil"
              className={PILL_SELECT_CLASS}
            >
              {boards.map(board => (
                <option key={board.id} value={board.id}>{board.name}</option>
              ))}
            </select>
            <PeriodFilterSelect value={period} onChange={setPeriod} className={PILL_SELECT_CLASS} />
            <Button variant="secondary" icon="download" onClick={handleExportPDF}>
              Baixar PDF
            </Button>
          </>
        }
      />

      {/* Meta do funil */}
      {hasGoal ? (
        <Panel
          title={`Meta: ${goalKpi}`}
          meta={<Badge tone={forecastGap <= 0 ? 'success' : isOnTrack ? 'info' : 'warning'}>{forecastGap <= 0 ? 'Meta batida' : isOnTrack ? 'No ritmo' : 'Abaixo do ritmo'}</Badge>}
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[length:var(--fs-caption)] text-[var(--text-secondary)]">Realizado</div>
              <div className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{formatGoalValue(currentValue)}</div>
            </div>
            <div>
              <div className="text-[length:var(--fs-caption)] text-[var(--text-secondary)]">Meta</div>
              <div className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{formatGoalValue(goalTarget)}</div>
            </div>
            <div>
              <div className="text-[length:var(--fs-caption)] text-[var(--text-secondary)]">Falta</div>
              <div className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                {forecastGap > 0 ? formatGoalValue(forecastGap) : 'Nada'}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <ProgressBar value={forecastPercent} tone={isOnTrack ? 'lime' : 'cyan'} height={8} className="flex-1" />
            <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">{forecastPercent.toFixed(0)}%</span>
          </div>
        </Panel>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--surface-card)] px-4 py-3">
          <Icon name="target" size={18} className="shrink-0 text-[var(--text-quiet)]" />
          <p className="min-w-0 flex-1 text-sm text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">Este funil ainda não tem meta.</span>{' '}
            Defina uma meta para acompanhar quanto falta para batê-la.
          </p>
          <Button variant="secondary" size="sm" icon="settings" onClick={() => router.push('/boards')}>
            Definir meta
          </Button>
        </div>
      )}

      {/* Números principais */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          variant="ink"
          label="Valor em negociação"
          value={formatBRL(pipelineValue)}
          unit={`${formatChange(changes.pipeline).text} ${comparison}`}
        />
        <StatCard
          label="Conversão"
          value={formatPercent(actualWinRate)}
          unit={`${formatChange(changes.winRate).text} ${comparison}`}
        />
        <StatCard
          label="Tempo médio para fechar"
          value={`${avgSalesCycle} ${avgSalesCycle === 1 ? 'dia' : 'dias'}`}
          unit={`mais rápido ${fastestDeal}d · mais lento ${slowestDeal}d`}
        />
        <StatCard
          label="Negócios fechados"
          value={`${wonDeals.length} / ${lostDeals.length}`}
          unit="ganhos / perdidos"
        />
      </div>

      {/* Receita e quem mais fechou */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Receita ganha" subtitle="Últimos 6 meses." className="flex min-h-[320px] flex-col lg:col-span-2">
          <div className="relative min-h-[240px] flex-1">
            <div className="absolute inset-0">
              <ChartWrapper height="100%">
                <LazyRevenueTrendChart data={trendData} />
              </ChartWrapper>
            </div>
          </div>
        </Panel>

        <Panel title="Quem mais fechou" subtitle="Receita ganha por responsável no período.">
          {leaderboard.length > 0 ? (
            <ol className="space-y-1">
              {leaderboard.map((rep, index) => (
                <li key={rep.id} className="flex items-center gap-3 rounded-[var(--radius-md)] p-2">
                  <span className="w-5 text-center text-sm font-semibold tabular-nums text-[var(--text-tertiary)]">{index + 1}</span>
                  {rep.avatar ? (
                    <Image src={rep.avatar} alt="" width={32} height={32} className="size-8 rounded-full" unoptimized />
                  ) : (
                    <span className="grid size-8 place-items-center rounded-full bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-secondary)]">
                      {rep.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{rep.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{rep.deals} {rep.deals === 1 ? 'negócio' : 'negócios'}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">{formatBRLShort(rep.revenue)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-[var(--text-secondary)]">
              <Icon name="users" size={28} className="text-[var(--text-quiet)]" />
              Nenhum negócio ganho no período.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default ReportsPage;
