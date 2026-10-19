import React from 'react';
import { Button, IconButton, PageHeader, SearchInput } from '@/design-system';
import { PILL_SELECT_CLASS } from '@/components/filters/pillSelectClass';

interface ContactsHeaderProps {
  viewMode: 'people' | 'companies';
  search: string;
  setSearch: (value: string) => void;
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'CHURNED' | 'RISK';
  setStatusFilter: (value: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'CHURNED' | 'RISK') => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (value: boolean) => void;
  openCreateModal: () => void;
  openImportExportModal?: () => void;
}

/**
 * Topo da tela de Contatos: título, frase de escopo e, à direita, busca, status,
 * filtros por data, importar/exportar e o botão de criar.
 */
export const ContactsHeader: React.FC<ContactsHeaderProps> = ({
  viewMode,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  isFilterOpen,
  setIsFilterOpen,
  openCreateModal,
  openImportExportModal,
}) => {
  const people = viewMode === 'people';
  return (
    <PageHeader
      title={people ? 'Contatos' : 'Empresas'}
      subtitle={people ? 'Pessoas que procuraram o escritório ou já são clientes.' : 'Organizações ligadas aos seus contatos.'}
      actions={
        <>
          <SearchInput
            value={search}
            onChange={(value) => setSearch(value)}
            placeholder={people ? 'Buscar contato' : 'Buscar empresa ou setor'}
            className="w-full sm:w-72"
          />
          {people && (
            <select
              value={statusFilter}
              onChange={e =>
                setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE' | 'CHURNED' | 'RISK')
              }
              aria-label="Filtrar por status"
              className={PILL_SELECT_CLASS}
            >
              <option value="ALL">Todos os status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
              <option value="CHURNED">Cancelados</option>
              <option value="RISK">Em risco</option>
            </select>
          )}
          <IconButton
            icon={isFilterOpen ? 'filter-x' : 'filter'}
            label={isFilterOpen ? 'Fechar filtros por data' : 'Filtrar por data'}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          />
          {people && (
            <IconButton icon="arrow-down-up" label="Importar ou exportar contatos" onClick={openImportExportModal} />
          )}
          <Button icon="plus" onClick={openCreateModal}>
            {people ? 'Novo contato' : 'Nova empresa'}
          </Button>
        </>
      }
    />
  );
};
