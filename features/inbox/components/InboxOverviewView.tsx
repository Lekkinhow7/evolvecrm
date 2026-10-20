import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, History, Inbox } from 'lucide-react';
import type { Activity } from '@/types';
import type { AISuggestion } from '../hooks/useInboxController';
import { usePendingAdvanceCountQuery } from '@/lib/query/hooks';
import { Badge, Button, StatCard } from '@/design-system';
import { PendingAdvancesSection } from './PendingAdvancesSection';

interface InboxOverviewViewProps {
  overdueActivities: Activity[];
  todayMeetings: Activity[];
  todayTasks: Activity[];
  upcomingActivities: Activity[];
  aiSuggestions: AISuggestion[];

  onGoToList: () => void;
  onStartFocus: () => void;
  onAcceptSuggestion: (suggestion: AISuggestion) => void;

  onOpenOverdue: () => void;
  onOpenToday: () => void;
  onOpenCriticalSuggestions: () => void;
  onOpenPending: () => void;
}

/** Quantos itens cada lista mostra antes do "Ver todos". */
const LIST_LIMIT = 6;

/** Primeira letra (ou emoji) do nome, para o avatar da linha. */
function initialOf(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toLocaleUpperCase('pt-BR') : '?';
}

const SuggestionRow: React.FC<{
  suggestion: AISuggestion;
  onAccept: () => void;
}> = ({ suggestion, onAccept }) => {
  const router = useRouter();
  const personName =
    suggestion.data.deal?.contactName || suggestion.data.contact?.name || suggestion.description;

  const navigationTarget = useMemo(() => {
    const dealId = suggestion.data.deal?.id;
    const contactId = suggestion.data.contact?.id;
    if (dealId) return `/boards?deal=${dealId}`;
    if (contactId) return `/contacts?contactId=${contactId}`;
    return null;
  }, [suggestion.data.deal?.id, suggestion.data.contact?.id]);

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:flex-nowrap">
      <span
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-accent)] text-[15px] font-semibold text-[var(--text-accent)]"
        aria-hidden="true"
      >
        {initialOf(personName)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium text-[var(--text-primary)]">{suggestion.description}</div>
        <div className="mt-0.5 truncate text-sm text-[var(--text-secondary)]">{suggestion.title}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!navigationTarget}
          onClick={() => navigationTarget && router.push(navigationTarget)}
        >
          Abrir
        </Button>
        <Button variant="primary" size="sm" icon={suggestion.type === 'UPSELL' ? 'plus' : 'check'} onClick={onAccept}>
          {suggestion.type === 'UPSELL' ? 'Criar negócio' : 'Criar tarefa'}
        </Button>
      </div>
    </li>
  );
};

const SuggestionList: React.FC<{
  title: string;
  icon: React.ElementType;
  items: AISuggestion[];
  total: number;
  emptyText: string;
  onSeeAll: () => void;
  onAccept: (suggestion: AISuggestion) => void;
}> = ({ title, icon: Icon, items, total, emptyText, onSeeAll, onAccept }) => (
  <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-hairline)] bg-[var(--surface-card)] shadow-[var(--shadow-xs)]">
    <header className="flex items-center gap-3 border-b border-[var(--border-hairline)] px-5 py-4">
      <span className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-accent)] text-[var(--text-accent)]" aria-hidden="true">
        <Icon size={18} />
      </span>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      {total > 0 ? <Badge tone="neutral" size="sm">{total}</Badge> : null}
      {total > items.length ? (
        <Button variant="ghost" size="sm" iconRight="arrow-right" className="ml-auto" onClick={onSeeAll}>
          Ver todos
        </Button>
      ) : null}
    </header>
    {items.length === 0 ? (
      <div className="flex items-center gap-3 px-5 py-8 text-sm text-[var(--text-tertiary)]">
        <Inbox size={18} aria-hidden="true" />
        {emptyText}
      </div>
    ) : (
      <ul className="divide-y divide-[var(--border-hairline)]">
        {items.map((s) => (
          <SuggestionRow key={s.id} suggestion={s} onAccept={() => onAccept(s)} />
        ))}
      </ul>
    )}
  </section>
);

/** Resumo do dia: números do que pede atenção e as listas de quem retomar. */
export const InboxOverviewView: React.FC<InboxOverviewViewProps> = ({
  overdueActivities,
  todayMeetings,
  todayTasks,
  upcomingActivities,
  aiSuggestions,
  onGoToList,
  onStartFocus,
  onAcceptSuggestion,
  onOpenOverdue,
  onOpenToday,
  onOpenCriticalSuggestions,
  onOpenPending,
}) => {
  const { data: pendingAdvanceCount = 0 } = usePendingAdvanceCountQuery();
  const todayTotal = todayMeetings.length + todayTasks.length;
  const totalPending = overdueActivities.length + todayTotal + aiSuggestions.length + pendingAdvanceCount;

  const highPrioritySuggestions = useMemo(
    () => aiSuggestions.filter(s => s.priority === 'high'),
    [aiSuggestions]
  );

  const riskSuggestions = useMemo(
    () => aiSuggestions.filter(s => s.type === 'STALLED' || s.type === 'RESCUE'),
    [aiSuggestions]
  );

  const opportunitySuggestions = useMemo(
    () => aiSuggestions.filter(s => s.type === 'UPSELL'),
    [aiSuggestions]
  );

  const canStartFocus = totalPending > 0;

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Resumo do dia</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {totalPending > 0
              ? `${totalPending} ${totalPending === 1 ? 'item pede' : 'itens pedem'} sua atenção.`
              : 'Nada pendente agora.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon="list" onClick={onGoToList}>
            Ver lista
          </Button>
          <Button variant="primary" icon="target" onClick={onStartFocus} disabled={!canStartFocus}>
            Começar foco
          </Button>
        </div>
      </div>

      {/* Números: mesmo cartão da Visão geral (um escuro, brancos e um lime) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          variant="ink"
          label="Atrasadas"
          value={overdueActivities.length.toLocaleString('pt-BR')}
          unit={overdueActivities.length > 0 ? 'resolver primeiro' : 'tudo em dia'}
          onClick={onOpenOverdue}
        />
        <StatCard
          label="Hoje"
          value={todayTotal.toLocaleString('pt-BR')}
          unit={todayTotal > 0 ? `${todayMeetings.length} reuniões · ${todayTasks.length} tarefas` : 'agenda livre'}
          onClick={onOpenToday}
        />
        <StatCard
          label="Para retomar já"
          value={highPrioritySuggestions.length.toLocaleString('pt-BR')}
          unit={highPrioritySuggestions.length > 0 ? 'negócios com valor parados' : 'sem urgências'}
          onClick={onOpenCriticalSuggestions}
        />
        {pendingAdvanceCount > 0 ? (
          <StatCard
            variant="lime"
            label="Aprovações da IA"
            value={pendingAdvanceCount.toLocaleString('pt-BR')}
            unit="aguardando sua decisão"
          />
        ) : (
          <StatCard
            variant="lime"
            label="Pendências"
            value={totalPending.toLocaleString('pt-BR')}
            unit={upcomingActivities.length > 0 ? `${upcomingActivities.length} nos próximos dias` : 'nada agendado adiante'}
            onClick={onOpenPending}
          />
        )}
      </div>

      {/* Listas (a de novo serviço vazia vira uma faixa, para não ocupar meia tela) */}
      <div className={`grid grid-cols-1 gap-6 ${opportunitySuggestions.length > 0 ? 'xl:grid-cols-2' : ''}`}>
        <SuggestionList
          title="Para retomar"
          icon={History}
          items={riskSuggestions.slice(0, LIST_LIMIT)}
          total={riskSuggestions.length}
          emptyText="Nenhum negócio parado agora."
          onSeeAll={onGoToList}
          onAccept={onAcceptSuggestion}
        />
        {opportunitySuggestions.length > 0 ? (
        <SuggestionList
          title="Clientes para novo serviço"
          icon={TrendingUp}
          items={opportunitySuggestions.slice(0, LIST_LIMIT)}
          total={opportunitySuggestions.length}
          emptyText="Nenhum cliente para novo serviço agora."
          onSeeAll={onGoToList}
          onAccept={onAcceptSuggestion}
        />
        ) : (
          <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-[var(--border-default)] px-5 py-4 text-sm text-[var(--text-secondary)]">
            <TrendingUp size={18} aria-hidden="true" className="text-[var(--text-tertiary)]" />
            <span>
              <span className="font-medium text-[var(--text-primary)]">Clientes para novo serviço:</span> nenhum agora. Aparecem aqui clientes que contrataram há mais de 30 dias.
            </span>
          </div>
        )}
      </div>

      {/* Aprovações da IA (HITL) — só aparece quando há pendências */}
      <PendingAdvancesSection limit={5} />
    </div>
  );
};
