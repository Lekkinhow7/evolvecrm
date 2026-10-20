import React, { useState } from 'react';
import { ChevronDown, Plus, Settings, Trash2 } from 'lucide-react';
import { Board } from '@/types';

interface BoardSelectorProps {
  boards: Board[];
  activeBoard: Board;
  onSelectBoard: (id: string) => void;
  onCreateBoard: () => void;
  onEditBoard?: (board: Board) => void;
  onDeleteBoard?: (id: string) => void;
}

/**
 * Componente React `BoardSelector`.
 *
 * @param {BoardSelectorProps} {
  boards,
  activeBoard,
  onSelectBoard,
  onCreateBoard,
  onEditBoard,
  onDeleteBoard,
} - Parâmetro `{
  boards,
  activeBoard,
  onSelectBoard,
  onCreateBoard,
  onEditBoard,
  onDeleteBoard,
}`.
 * @returns {Element} Retorna um valor do tipo `Element`.
 */
export const BoardSelector: React.FC<BoardSelectorProps> = ({
  boards,
  activeBoard,
  onSelectBoard,
  onCreateBoard,
  onEditBoard,
  onDeleteBoard,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Funil: ${activeBoard.name}. Trocar de funil`}
        className="flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1 transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        <span className="text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          {activeBoard.name}
        </span>
        <ChevronDown size={20} className={`text-[var(--text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 z-50 mt-2 w-72 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-md)]">
            {/* Board List */}
            <div className="max-h-80 overflow-y-auto py-1">
              {boards.map(board => (
                <div
                  key={board.id}
                  className={`group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                    board.id === activeBoard.id
                      ? 'bg-[var(--surface-accent)]'
                      : 'hover:bg-[var(--surface-hover)]'
                  }`}
                  onClick={() => { onSelectBoard(board.id); setIsOpen(false); }}
                >
                  <div className={`h-2 w-2 flex-shrink-0 rounded-full ${
                    board.id === activeBoard.id ? 'bg-[var(--brand-cyan)]' : 'bg-[var(--border-default)]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`truncate text-sm font-medium ${
                      board.id === activeBoard.id
                        ? 'text-[var(--text-accent)]'
                        : 'text-[var(--text-primary)]'
                    }`}>
                      {board.name}
                    </p>
                    {board.description && (
                      <p className="truncate text-xs text-[var(--text-tertiary)]">
                        {board.description}
                      </p>
                    )}
                  </div>

                  {/* Action buttons - aparecem no hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEditBoard && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditBoard(board);
                          setIsOpen(false);
                        }}
                        className="rounded-[var(--radius-md)] p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                        title="Configurar funil"
                        aria-label={`Configurar funil ${board.name}`}
                      >
                        <Settings size={14} />
                      </button>
                    )}
                    {/* Pode excluir se não for o único funil */}
                    {onDeleteBoard && boards.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBoard(board.id);
                          setIsOpen(false);
                        }}
                        className="rounded-[var(--radius-md)] p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--status-danger-fg)]"
                        title="Excluir funil"
                        aria-label={`Excluir funil ${board.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Novo funil: sempre visível no fim da lista */}
            <div className="border-t border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => { onCreateBoard(); setIsOpen(false); }}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--text-accent)] transition-colors hover:bg-[var(--surface-hover)]"
              >
                <Plus size={16} />
                Novo funil
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
