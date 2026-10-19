import React from 'react';
import { SearchInput } from '@/design-system';
import { PILL_SELECT_CLASS } from '@/components/filters/pillSelectClass';
import { Activity } from '@/types';

interface ActivitiesFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterType: Activity['type'] | 'ALL';
  setFilterType: (type: Activity['type'] | 'ALL') => void;
}

/** Busca e filtro por tipo da lista de tarefas. */
export const ActivitiesFilters: React.FC<ActivitiesFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
}) => {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <SearchInput
        value={searchTerm}
        onChange={(value) => setSearchTerm(value)}
        placeholder="Buscar tarefa"
        className="min-w-[16rem] flex-1"
      />
      <select
        className={PILL_SELECT_CLASS}
        aria-label="Filtrar por tipo"
        value={filterType}
        onChange={e => setFilterType(e.target.value as Activity['type'] | 'ALL')}
      >
        <option value="ALL">Todos os tipos</option>
        <option value="CALL">Ligações</option>
        <option value="MEETING">Reuniões</option>
        <option value="EMAIL">E-mails</option>
        <option value="TASK">Tarefas</option>
      </select>
    </div>
  );
};
