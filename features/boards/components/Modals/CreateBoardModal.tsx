import React, { useMemo, useState, useId, useRef } from 'react';
import { Plus, GripVertical, Trash2, ChevronDown, Settings, Copy, Bot } from 'lucide-react';
import { Board, BoardStage, ContactStage } from '@/types';
import { BOARD_TEMPLATES, BoardTemplateType } from '@/lib/templates/board-templates';
import { LifecycleSettingsModal } from '@/features/settings/components/LifecycleSettingsModal';
import { BoardAIConfigModal } from './BoardAIConfigModal';
import { useLifecycleStages } from '@/lib/query/hooks/useLifecycleStagesQuery';
import { useActiveProducts } from '@/lib/query/hooks/useProductsQuery';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/design-system';
import { MODAL_FOOTER_CLASS, FIELD_LABEL_CLASS, FIELD_INPUT_CLASS, FIELD_HINT_CLASS } from '@/components/ui/modalStyles';
import { slugify } from '@/lib/utils/slugify';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (board: Omit<Board, 'id' | 'createdAt'>) => void;
  editingBoard?: Board; // Se fornecido, estamos editando
  availableBoards: Board[]; // Para selecionar o próximo board
  /**
   * Optional: allow switching which board is being edited without closing the modal.
   * This removes the "close → gear → pick another board" friction.
   */
  onSwitchEditingBoard?: (board: Board) => void;
  /** Ao editar, abre já com uma etapa nova no fim e o foco no nome dela. */
  focusNewStage?: boolean;
}

type StageRole = NonNullable<BoardStage['role']>;

const STAGE_ROLE_OPTIONS: Array<{ value: '' | StageRole; label: string }> = [
  { value: '', label: 'Nenhum' },
  { value: 'reuniao_agendada', label: 'Reunião agendada' },
  { value: 'analise_documentos', label: 'Análise de documentos' },
];

const STAGE_SELECT_CLASS =
  'w-full min-h-10 cursor-pointer rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--cyan-400)] focus:shadow-[var(--focus-ring)] dark:[color-scheme:dark]';

const STAGE_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
];

const CREATE_BOARD_DRAFT_KEY = 'createBoardDraft.v1';

function normalizeStageLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function createDragPreviewFromElement(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.boxSizing = 'border-box';
  clone.style.position = 'fixed';
  clone.style.top = '-1000px';
  clone.style.left = '-1000px';
  clone.style.pointerEvents = 'none';
  clone.style.opacity = '0.95';
  clone.style.transform = 'scale(1.02)';
  clone.style.borderRadius = '16px';
  clone.style.zIndex = '999999';
  document.body.appendChild(clone);
  return () => {
    try {
      document.body.removeChild(clone);
    } catch {
      // noop
    }
  };
}

function guessWonLostStageIds(stages: BoardStage[], opts?: { wonLabel?: string; lostLabel?: string }) {
  const byLabel = new Map<string, string>();
  for (const s of stages) {
    byLabel.set(normalizeStageLabel(s.label), s.id);
  }

  const exactWon = opts?.wonLabel ? byLabel.get(normalizeStageLabel(opts.wonLabel)) : undefined;
  const exactLost = opts?.lostLabel ? byLabel.get(normalizeStageLabel(opts.lostLabel)) : undefined;

  // Fallback heuristic: keep it conservative and readable.
  const heuristicWon =
    exactWon
    ?? stages.find(s => /\b(ganho|won|fechado ganho|conclu[ií]do)\b/i.test(s.label))?.id;
  const heuristicLost =
    exactLost
    ?? stages.find(s => /\b(perdido|lost|churn|cancelad[oa])\b/i.test(s.label))?.id;

  return { wonStageId: heuristicWon ?? '', lostStageId: heuristicLost ?? '' };
}


/**
 * Componente React `CreateBoardModal`.
 *
 * @param {CreateBoardModalProps} {
  isOpen,
  onClose,
  onSave,
  editingBoard,
  availableBoards,
  onSwitchEditingBoard,
} - Parâmetro `{
  isOpen,
  onClose,
  onSave,
  editingBoard,
  availableBoards,
  onSwitchEditingBoard,
}`.
 * @returns {Element} Retorna um valor do tipo `Element`.
 */
export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBoard,
  availableBoards,
  onSwitchEditingBoard,
  focusNewStage = false,
}) => {
  const headingId = useId();
  const stageNameRefs = useRef(new Map<string, HTMLInputElement>());
  const focusAppliedRef = useRef(false);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);

  React.useEffect(() => {
  }, [isOpen]);

  const { data: lifecycleStages = [] } = useLifecycleStages();
  const { data: products = [] } = useActiveProducts();
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [boardKey, setBoardKey] = useState('');
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [nextBoardId, setNextBoardId] = useState<string>('');
  const [linkedLifecycleStage, setLinkedLifecycleStage] = useState<string>('');
  const [wonStageId, setWonStageId] = useState<string>('');
  const [lostStageId, setLostStageId] = useState<string>('');
  const [wonStayInStage, setWonStayInStage] = useState(false);
  const [lostStayInStage, setLostStayInStage] = useState(false);
  const [defaultProductId, setDefaultProductId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplateType | ''>('');
  const [stages, setStages] = useState<BoardStage[]>([]);
  const [isLifecycleModalOpen, setIsLifecycleModalOpen] = useState(false);
  const [isAIConfigModalOpen, setIsAIConfigModalOpen] = useState(false);
  const [draggingStageId, setDraggingStageId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (editingBoard) {
        setName(editingBoard.name);
        setBoardKey(editingBoard.key || slugify(editingBoard.name));
        setKeyTouched(false);
        setDescription(editingBoard.description || '');
        setNextBoardId(editingBoard.nextBoardId || '');
        setLinkedLifecycleStage(editingBoard.linkedLifecycleStage || '');
        setWonStageId(editingBoard.wonStageId || '');
        setLostStageId(editingBoard.lostStageId || '');
        setWonStayInStage(editingBoard.wonStayInStage || false);
        setLostStayInStage(editingBoard.lostStayInStage || false);
        setDefaultProductId(editingBoard.defaultProductId || '');
        setSelectedTemplate(editingBoard.template || '');
        if (focusNewStage && !focusAppliedRef.current) {
          focusAppliedRef.current = true;
          const fresh: BoardStage = {
            id: crypto.randomUUID(),
            label: `Etapa ${editingBoard.stages.length + 1}`,
            color: STAGE_COLORS[editingBoard.stages.length % STAGE_COLORS.length],
          };
          setStages([...editingBoard.stages, fresh]);
          setPendingFocusId(fresh.id);
        } else {
          setStages(editingBoard.stages);
        }
      } else {
        // Restore draft (so we can close modal immediately on save and re-open on error without losing inputs)
        try {
          const raw = sessionStorage.getItem(CREATE_BOARD_DRAFT_KEY);
          if (raw) {
            const draft = JSON.parse(raw) as any;
            if (draft && typeof draft === 'object') {
              setName(String(draft.name ?? ''));
              setBoardKey(String(draft.boardKey ?? ''));
              setKeyTouched(Boolean(draft.keyTouched));
              setDescription(String(draft.description ?? ''));
              setNextBoardId(String(draft.nextBoardId ?? ''));
              setLinkedLifecycleStage(String(draft.linkedLifecycleStage ?? ''));
              setWonStageId(String(draft.wonStageId ?? ''));
              setLostStageId(String(draft.lostStageId ?? ''));
              setWonStayInStage(Boolean(draft.wonStayInStage));
              setLostStayInStage(Boolean(draft.lostStayInStage));
              setDefaultProductId(String(draft.defaultProductId ?? ''));
              setSelectedTemplate((draft.selectedTemplate as BoardTemplateType) ?? '');
              setStages(Array.isArray(draft.stages) ? draft.stages : []);
              return;
            }
          }
        } catch {
          // ignore
        }
        // Reset for new board
        setName('');
        setBoardKey('');
        setKeyTouched(false);
        setDescription('');
        setNextBoardId('');
        setLinkedLifecycleStage('');
        setWonStageId('');
        setLostStageId('');
        setWonStayInStage(false);
        setLostStayInStage(false);
        setDefaultProductId('');
        setSelectedTemplate('');
        setStages([
          { id: crypto.randomUUID(), label: 'Nova', color: 'bg-blue-500' },
          { id: crypto.randomUUID(), label: 'Em Progresso', color: 'bg-yellow-500' },
          { id: crypto.randomUUID(), label: 'Concluído', color: 'bg-green-500' },
        ]);
      }
    } else {
      focusAppliedRef.current = false;
    }
  }, [isOpen, editingBoard]);

  // Foco no nome da etapa recém-criada (vinda de "+ Nova etapa" no quadro).
  React.useEffect(() => {
    if (!pendingFocusId) return;
    const input = stageNameRefs.current.get(pendingFocusId);
    if (input) {
      input.focus();
      input.select();
      setPendingFocusId(null);
    }
  }, [pendingFocusId, stages]);

  // Filter out current board to prevent self-reference
  // Performance: avoid filtering on every render.
  const validNextBoards = useMemo(
    () => availableBoards.filter(b => b.id !== editingBoard?.id),
    [availableBoards, editingBoard?.id]
  );

  const handleAddStage = () => {
    const colorIndex = stages.length % STAGE_COLORS.length;
    setStages([...stages, {
      id: crypto.randomUUID(),
      label: `Etapa ${stages.length + 1}`,
      color: STAGE_COLORS[colorIndex]
    }]);
  };

  const handleRemoveStage = (id: string) => {
    if (stages.length > 2) {
      setStages(stages.filter(s => s.id !== id));
    }
  };

  const handleUpdateStage = (id: string, updates: Partial<BoardStage>) => {
    setStages(stages.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  /** Um papel por funil: dar o papel a uma etapa tira da que já o tinha. */
  const handleSetStageRole = (id: string, role: StageRole | undefined) => {
    setStages(prev => prev.map(s => {
      if (s.id === id) return { ...s, role };
      if (role && s.role === role) return { ...s, role: undefined };
      return s;
    }));
  };

  /**
   * UX: allow reordering stages by drag-and-drop.
   * No external deps: uses HTML5 drag events.
   */
  const moveStage = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setStages(prev => {
      const fromIndex = prev.findIndex(s => s.id === fromId);
      const toIndex = prev.findIndex(s => s.id === toId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleTemplateSelect = (template: BoardTemplateType | '') => {
    setSelectedTemplate(template);

    if (template && BOARD_TEMPLATES[template]) {
      const templateData = BOARD_TEMPLATES[template];
      setName(templateData.name);
      setDescription(templateData.description);
      setLinkedLifecycleStage(templateData.linkedLifecycleStage || '');
      const nextStages = templateData.stages.map((s, idx) => ({
        id: crypto.randomUUID(),
        ...s
      }));
      setStages(nextStages);

      // UX: auto-fill won/lost stages for templates using deterministic labels, with heuristic fallback.
      const guessed = guessWonLostStageIds(nextStages, {
        wonLabel: templateData.defaultWonStageLabel,
        lostLabel: templateData.defaultLostStageLabel,
      });
      setWonStageId(guessed.wonStageId);
      setLostStageId(guessed.lostStageId);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const normalizedKey = boardKey.trim() ? slugify(boardKey) : '';
    if (boardKey.trim() && !normalizedKey) {
      addToast('Chave inválida. Use letras/números e hífen.', 'error');
      return;
    }

    const payload = {
      name: name.trim(),
      key: normalizedKey || undefined,
      description: description.trim() || undefined,
      nextBoardId: (nextBoardId || null) as any,
      linkedLifecycleStage: (linkedLifecycleStage || null) as any,
      wonStageId: (wonStageId || null) as any,
      lostStageId: (lostStageId || null) as any,
      wonStayInStage,
      lostStayInStage,
      defaultProductId: (defaultProductId || null) as any,
      template: selectedTemplate || 'CUSTOM',
      stages,
      isDefault: false
    };
    // Persist draft before closing (so we can restore on error)
    try {
      sessionStorage.setItem(
        CREATE_BOARD_DRAFT_KEY,
        JSON.stringify({
          name,
          boardKey,
          keyTouched,
          description,
          nextBoardId,
          linkedLifecycleStage,
          wonStageId,
          lostStageId,
          wonStayInStage,
          lostStayInStage,
          defaultProductId,
          selectedTemplate,
          stages,
        })
      );
    } catch {
      // ignore
    }

    addToast(editingBoard ? 'Salvando funil...' : 'Criando funil...', 'info');
    onClose(); // close immediately for UX

    try {
      onSave(payload);
    } catch (e) {
      addToast((e as Error).message || 'Erro ao salvar o funil', 'error');
      onClose(); // ensure closed state is consistent
    }
  };

  const handleCopyKey = async () => {
    const normalizedKey = boardKey.trim() ? slugify(boardKey) : '';
    if (!normalizedKey) {
      addToast('Defina uma chave primeiro.', 'warning');
      return;
    }
    try {
      await navigator.clipboard.writeText(normalizedKey);
      addToast('Chave copiada.', 'success');
    } catch {
      addToast('Não foi possível copiar.', 'error');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editingBoard ? 'Configurar funil' : 'Novo funil'}
        size="lg"
        labelledById={headingId}
        className="max-w-xl"
        // We control padding/scroll inside, so keep the Modal body wrapper flat.
        bodyClassName="p-0"
        // Nested modal: avoid trapping focus behind the lifecycle modal.
        focusTrapEnabled={!isLifecycleModalOpen}
      >
        <div className="flex flex-col">
          {/* 
            Scroll container:
            Use an explicit max-height so the form never "explodes" beyond the visible area.
            Keeps the footer always reachable/visible.
          */}
          <div className="overflow-y-auto p-4 sm:p-6 space-y-6 max-h-[calc(100dvh-14rem)] sm:max-h-[calc(100dvh-18rem)]">
              {/* Switch board (edit mode only) */}
              {editingBoard && onSwitchEditingBoard && availableBoards.length > 1 && (
                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    Editando funil
                  </label>
                  <div className="relative">
                    <select
                      value={editingBoard.id}
                      onChange={(e) => {
                        const next = availableBoards.find(b => b.id === e.target.value);
                        if (next) onSwitchEditingBoard(next);
                      }}
                      className={`${FIELD_INPUT_CLASS} appearance-none pr-10`}
                      aria-label="Selecionar funil para editar"
                    >
                      {availableBoards.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                      aria-hidden="true"
                    />
                  </div>
                  <p className={FIELD_HINT_CLASS}>
                    Troque aqui para editar outro funil.
                  </p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className={FIELD_LABEL_CLASS}>
                  Nome do funil *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const next = e.target.value;
                    setName(next);
                    if (!keyTouched) setBoardKey(slugify(next));
                  }}
                  placeholder="Ex.: Atendimento"
                  className={FIELD_INPUT_CLASS}
                />
              </div>

              {/* Description */}
              <div>
                <label className={FIELD_LABEL_CLASS}>
                  Descrição
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Para que serve este funil"
                  className={FIELD_INPUT_CLASS}
                />
              </div>

              {/* Template Selection (only for new boards) */}
              {!editingBoard && (
                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    Começar de um modelo
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value as BoardTemplateType | '')}
                    className={FIELD_INPUT_CLASS}
                  >
                    <option value="">Funil em branco</option>
                    <option value="PRE_SALES">Pré-atendimento</option>
                    <option value="SALES">Vendas</option>
                    <option value="ONBOARDING">Início do atendimento</option>
                    <option value="CS">Clientes ativos</option>
                  </select>
                  {selectedTemplate && (
                    <p className={FIELD_HINT_CLASS}>
                      Modelo aplicado. Você pode ajustar tudo abaixo.
                    </p>
                  )}
                </div>
              )}

              <div className="pt-5 border-t border-[var(--border-hairline)]">
              {/* Stages */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Etapas
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddStage}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--text-accent)] hover:bg-[var(--surface-accent)] rounded-[var(--radius-pill)] transition-colors"
                    >
                      <Plus size={14} />
                      Adicionar etapa
                    </button>
                    {editingBoard && (
                      <button
                        onClick={() => setIsAIConfigModalOpen(true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] rounded-[var(--radius-pill)] transition-colors"
                      >
                        <Bot size={14} />
                        Assistente
                      </button>
                    )}
                    <button
                      onClick={() => setIsLifecycleModalOpen(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] rounded-[var(--radius-pill)] transition-colors"
                    >
                      <Settings size={14} />
                      Estágios do contato
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {stages.map((stage, index) => (
                    <div
                      key={stage.id}
                      data-stage-card="true"
                      className={`p-4 bg-[var(--surface-sunken)] rounded-[var(--radius-lg)] border transition-colors ${
                        dragOverStageId === stage.id
                          ? 'border-[var(--cyan-400)] shadow-[var(--focus-ring)]'
                          : draggingStageId === stage.id
                            ? 'border-[var(--border-accent)] opacity-70 shadow-[var(--shadow-lg)]'
                            : 'border-[var(--border-hairline)] hover:border-[var(--border-default)]'
                      }`}
                      onDragOver={(e) => {
                        // Required to allow dropping.
                        e.preventDefault();
                        if (draggingStageId) setDragOverStageId(stage.id);
                      }}
                      onDragLeave={() => {
                        if (dragOverStageId === stage.id) setDragOverStageId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromId = e.dataTransfer.getData('text/stage-id');
                        if (fromId) moveStage(fromId, stage.id);
                        setDraggingStageId(null);
                        setDragOverStageId(null);
                      }}
                    >
                      {/* Stage Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          type="button"
                          draggable
                          onDragStart={(e) => {
                            setDraggingStageId(stage.id);
                            e.dataTransfer.setData('text/stage-id', stage.id);
                            e.dataTransfer.effectAllowed = 'move';
                            // Use the whole card as the drag "ghost" so it feels like you're dragging the item.
                            const card = (e.currentTarget.closest('[data-stage-card="true"]') as HTMLElement | null);
                            if (card) {
                              const cleanup = createDragPreviewFromElement(card);
                              // Ensure cleanup runs even if the browser doesn't fire dragend for some edge cases.
                              window.setTimeout(cleanup, 0);
                              e.dataTransfer.setDragImage(card, 24, 24);
                            }
                          }}
                          onDragEnd={() => {
                            setDraggingStageId(null);
                            setDragOverStageId(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing flex-shrink-0"
                          aria-label={`Reordenar etapa: ${stage.label}`}
                          title="Arraste para reordenar"
                        >
                          <GripVertical size={18} aria-hidden="true" />
                        </button>

                        {/* Color Picker */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full ${stage.color} cursor-pointer ring-2 ring-slate-200 dark:ring-slate-700 hover:ring-slate-300 dark:hover:ring-slate-600 transition-all`} />
                          <select
                            value={stage.color}
                            onChange={(e) => handleUpdateStage(stage.id, { color: e.target.value })}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          >
                            {STAGE_COLORS.map(color => (
                              <option key={color} value={color}>{color.replace('bg-', '').replace('-500', '')}</option>
                            ))}
                          </select>
                        </div>

                        {/* Label */}
                        <input
                          type="text"
                          value={stage.label}
                          onChange={(e) => handleUpdateStage(stage.id, { label: e.target.value })}
                          ref={(el) => {
                            if (el) stageNameRefs.current.set(stage.id, el);
                            else stageNameRefs.current.delete(stage.id);
                          }}
                          className="flex-1 min-h-10 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--surface-card)] text-[var(--text-primary)] outline-none focus:border-[var(--cyan-400)] focus:shadow-[var(--focus-ring)]"
                          placeholder="Nome da etapa"
                        />

                        {/* Delete */}
                        <button
                          onClick={() => handleRemoveStage(stage.id)}
                          disabled={stages.length <= 2}
                          className="p-2 text-[var(--text-tertiary)] hover:text-[var(--status-danger-fg)] hover:bg-[var(--status-danger-bg)] rounded-[var(--radius-pill)] disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
                          title="Remover etapa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
                      {/* Papel da etapa (usado pelas portas da agenda) */}
                      <div>
                        <label
                          htmlFor={`stage-role-${stage.id}`}
                          className="mb-1.5 block text-xs text-[var(--text-secondary)]"
                        >
                          Papel da etapa
                        </label>
                        <select
                          id={`stage-role-${stage.id}`}
                          value={stage.role ?? ''}
                          onChange={(e) => handleSetStageRole(stage.id, (e.target.value || undefined) as StageRole | undefined)}
                          className={STAGE_SELECT_CLASS}
                        >
                          {STAGE_ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Lifecycle Automation */}
                      <div>
                        <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">
                          Muda o contato para
                        </label>
                        <div className="relative">
                          <select
                            value={stage.linkedLifecycleStage || ''}
                            onChange={(e) => handleUpdateStage(stage.id, { linkedLifecycleStage: e.target.value || undefined })}
                            className={STAGE_SELECT_CLASS}
                          >
                            <option value="">Sem automação</option>
                            {lifecycleStages.map(ls => (
                              <option key={ls.id} value={ls.id}>{ls.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>

              <div className="pt-5 border-t border-[var(--border-hairline)] space-y-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quando o caso fechar</h3>
              {/* Explicit Won/Lost Stages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    Etapa de quem contratou
                  </label>
                  <select
                    value={wonStayInStage ? 'archive' : wonStageId}
                    onChange={(e) => {
                      if (e.target.value === 'archive') {
                        setWonStayInStage(true);
                        setWonStageId('');
                      } else {
                        setWonStayInStage(false);
                        setWonStageId(e.target.value);
                      }
                    }}
                    className={FIELD_INPUT_CLASS}
                  >
                    <option value="">Automático</option>
                    <option value="archive">Arquivar (fica na etapa atual)</option>
                    {stages.map(stage => (
                      <option key={stage.id} value={stage.id}>{stage.label}</option>
                    ))}
                  </select>
                  <p className={FIELD_HINT_CLASS}>
                    O botão "Contratou" leva o card para cá.
                  </p>
                </div>
                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    Etapa de quem não contratou
                  </label>
                  <select
                    value={lostStayInStage ? 'archive' : lostStageId}
                    onChange={(e) => {
                      if (e.target.value === 'archive') {
                        setLostStayInStage(true);
                        setLostStageId('');
                      } else {
                        setLostStayInStage(false);
                        setLostStageId(e.target.value);
                      }
                    }}
                    className={FIELD_INPUT_CLASS}
                  >
                    <option value="">Automático</option>
                    <option value="archive">Arquivar (fica na etapa atual)</option>
                    {stages.map(stage => (
                      <option key={stage.id} value={stage.id}>{stage.label}</option>
                    ))}
                  </select>
                  <p className={FIELD_HINT_CLASS}>
                    O botão "Não contratou" leva o card para cá.
                  </p>
                </div>
              </div>

              {/* Next Board Automation */}
              <div>
                <label className={FIELD_LABEL_CLASS}>
                  Quando contratar, abrir negócio no funil
                </label>
                <select
                  value={nextBoardId}
                  onChange={(e) => setNextBoardId(e.target.value)}
                  className={FIELD_INPUT_CLASS}
                >
                  <option value="">Nenhum (termina aqui)</option>
                  {validNextBoards.map(board => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
                <p className={FIELD_HINT_CLASS}>
                  Cria um card no outro funil quando o cliente contrata.
                </p>
              </div>

              </div>

              <details className="group pt-5 border-t border-[var(--border-hairline)]">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[var(--text-primary)]">
                  Avançado
                  <ChevronDown size={16} className="text-[var(--text-tertiary)] transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="mt-4 space-y-4">
              {/* Board key (slug) */}
              <div>
                <label className={FIELD_LABEL_CLASS}>
                  Chave para integrações
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={boardKey}
                    onChange={(e) => {
                      setKeyTouched(true);
                      setBoardKey(e.target.value);
                    }}
                    placeholder="ex.: atendimento"
                    className={`${FIELD_INPUT_CLASS} font-mono`}
                  />
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="shrink-0 px-3 rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--surface-card)] hover:bg-[var(--surface-sunken)] text-[var(--text-secondary)]"
                    aria-label="Copiar chave do funil"
                    title="Copiar chave"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className={FIELD_HINT_CLASS}>
                  Usada pelo n8n e pelo site para saber em qual funil criar o negócio.
                </p>
              </div>

              {/* Linked Lifecycle Stage */}
              <div>
                <label className={FIELD_LABEL_CLASS}>
                  Puxar contatos do estágio
                </label>
                <select
                  value={linkedLifecycleStage}
                  onChange={(e) => setLinkedLifecycleStage(e.target.value)}
                  className={FIELD_INPUT_CLASS}
                >
                  <option value="">Nenhum</option>
                  {lifecycleStages.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
                <p className={FIELD_HINT_CLASS}>
                  Contatos que entrarem nesse estágio ganham um negócio neste funil.
                </p>
              </div>

              {/* Default Product */}
              <div>
                <label className={FIELD_LABEL_CLASS}>
                  Serviço padrão
                </label>
                <select
                  value={defaultProductId}
                  onChange={(e) => setDefaultProductId(e.target.value)}
                  className={FIELD_INPUT_CLASS}
                >
                  <option value="">Nenhum</option>
                  {products
                    .filter(p => p.active !== false)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — R$ {Number(p.price ?? 0).toLocaleString('pt-BR')}
                      </option>
                    ))}
                </select>
                <p className={FIELD_HINT_CLASS}>
                  Já vem selecionado ao adicionar serviços num negócio deste funil.
                </p>
              </div>

                </div>
              </details>
          </div>

          {/* Footer */}
          <div className={`${MODAL_FOOTER_CLASS} flex justify-end gap-3`}>
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!name.trim()}>
                {editingBoard ? 'Salvar alterações' : 'Criar funil'}
              </Button>
          </div>
        </div>
      </Modal>

      <LifecycleSettingsModal
        isOpen={isLifecycleModalOpen}
        onClose={() => setIsLifecycleModalOpen(false)}
      />

      {editingBoard && (
        <BoardAIConfigModal
          isOpen={isAIConfigModalOpen}
          onClose={() => setIsAIConfigModalOpen(false)}
          board={editingBoard}
        />
      )}
    </>
  );
};
