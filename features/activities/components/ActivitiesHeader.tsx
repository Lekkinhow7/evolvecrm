import React from 'react';
import { Badge, Button, PageHeader, Segmented } from '@/design-system';

interface ActivitiesHeaderProps {
  viewMode: 'list' | 'calendar';
  setViewMode: (mode: 'list' | 'calendar') => void;
  onNewActivity: () => void;
  dateFilter?: 'ALL' | 'overdue' | 'today' | 'upcoming';
  /** Título da tela (padrão "Tarefas"; a rota /agenda usa "Agenda"). */
  title?: string;
  subtitle?: string;
}

const FILTER_LABEL: Record<string, string> = { overdue: 'Atrasadas', today: 'Hoje', upcoming: 'Próximas' };

/** Topo de Tarefas e Agenda: título, filtro ativo, lista/calendário e "Nova tarefa". */
export const ActivitiesHeader: React.FC<ActivitiesHeaderProps> = ({
  viewMode,
  setViewMode,
  onNewActivity,
  dateFilter = 'ALL',
  title = 'Tarefas',
  subtitle = 'Tarefas, ligações e reuniões da equipe.',
}) => {
  const filterLabel = FILTER_LABEL[dateFilter];

  return (
    <PageHeader
      className="mb-6"
      title={title}
      subtitle={
        <span className="inline-flex flex-wrap items-center gap-2">
          {subtitle}
          {filterLabel ? <Badge tone="info">Mostrando: {filterLabel}</Badge> : null}
        </span>
      }
      actions={
        <>
          <Segmented
            variant="text"
            value={viewMode}
            onChange={(value) => setViewMode(value as 'list' | 'calendar')}
            options={[
              { value: 'list', label: 'Lista' },
              { value: 'calendar', label: 'Calendário' },
            ]}
          />
          <Button icon="plus" onClick={onNewActivity}>
            Nova tarefa
          </Button>
        </>
      }
    />
  );
};
