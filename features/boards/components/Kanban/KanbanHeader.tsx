import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button, Icon, IconButton, SearchInput, Segmented } from '@/design-system';
import { PILL_SELECT_CLASS } from '@/components/filters/pillSelectClass';
import { Board } from '@/types';
import { BoardSelector } from '../BoardSelector';

interface KanbanHeaderProps {
    // Boards
    boards: Board[];
    activeBoard: Board;
    onSelectBoard: (id: string) => void;
    onCreateBoard: () => void;
    onEditBoard?: (board: Board) => void;
    onDeleteBoard?: (id: string) => void;
    onExportTemplates?: () => void;
    // View
    viewMode: 'kanban' | 'list';
    setViewMode: (mode: 'kanban' | 'list') => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    ownerFilter: 'all' | 'mine';
    setOwnerFilter: (filter: 'all' | 'mine') => void;
    statusFilter: 'open' | 'won' | 'lost' | 'all';
    setStatusFilter: (filter: 'open' | 'won' | 'lost' | 'all') => void;
    onNewDeal: () => void;
}

/**
 * Topo do Kanban: funil (com configurações) e "Novo negócio" na primeira linha;
 * busca, filtros e o modo de ver (quadro ou lista) na segunda.
 */
export const KanbanHeader: React.FC<KanbanHeaderProps> = ({
    boards,
    activeBoard,
    onSelectBoard,
    onCreateBoard,
    onEditBoard,
    onDeleteBoard,
    onExportTemplates,
    viewMode, setViewMode,
    searchTerm, setSearchTerm,
    ownerFilter, setOwnerFilter,
    statusFilter, setStatusFilter,
    onNewDeal
}) => {
    const suggestions = activeBoard.automationSuggestions ?? [];
    return (
        <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <BoardSelector
                    boards={boards}
                    activeBoard={activeBoard}
                    onSelectBoard={onSelectBoard}
                    onCreateBoard={onCreateBoard}
                    onEditBoard={onEditBoard}
                    onDeleteBoard={onDeleteBoard}
                />
                {onEditBoard && (
                    <IconButton icon="settings" label="Configurar funil" variant="ghost" onClick={() => onEditBoard(activeBoard)} />
                )}
                {onExportTemplates && (
                    <IconButton icon="download" label="Exportar modelo do funil" variant="ghost" onClick={onExportTemplates} />
                )}
                {suggestions.length > 0 && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                aria-label="Sugestões de automação"
                                title="Sugestões de automação"
                                className="relative grid size-10 place-items-center rounded-[var(--radius-md)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                            >
                                <Icon name="lightbulb" size={18} />
                                <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--status-warning-solid)]" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                            <div className="border-b border-[var(--border-hairline)] p-4">
                                <h4 className="font-semibold text-[var(--text-primary)]">Sugestões de automação</h4>
                                <p className="mt-1 text-xs text-[var(--text-secondary)]">Ideias da IA para este funil.</p>
                            </div>
                            <ul className="space-y-1 p-2">
                                {suggestions.map((suggestion, idx) => (
                                    <li key={idx} className="flex items-start gap-2 rounded-md p-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
                                        <span className="mt-0.5 text-[var(--text-quiet)]">•</span>
                                        <span>{suggestion}</span>
                                    </li>
                                ))}
                            </ul>
                        </PopoverContent>
                    </Popover>
                )}
                <div className="ml-auto">
                    <Button icon="plus" onClick={onNewDeal}>Novo negócio</Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                    value={searchTerm}
                    onChange={(value) => setSearchTerm(value)}
                    placeholder="Buscar negócio ou empresa"
                    className="w-full sm:w-72"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'open' | 'won' | 'lost' | 'all')}
                    aria-label="Filtrar por situação"
                    className={PILL_SELECT_CLASS}
                >
                    <option value="open">Em aberto</option>
                    <option value="won">Ganhos</option>
                    <option value="lost">Perdidos</option>
                    <option value="all">Todos</option>
                </select>
                <select
                    value={ownerFilter}
                    onChange={(e) => setOwnerFilter(e.target.value as 'all' | 'mine')}
                    aria-label="Filtrar por responsável"
                    className={PILL_SELECT_CLASS}
                >
                    <option value="all">Todos os responsáveis</option>
                    <option value="mine">Só os meus</option>
                </select>
                <div className="ml-auto">
                    <Segmented
                        variant="text"
                        size="sm"
                        value={viewMode}
                        onChange={(value) => setViewMode(value as 'kanban' | 'list')}
                        options={[
                            { value: 'kanban', label: 'Quadro' },
                            { value: 'list', label: 'Lista' },
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};
