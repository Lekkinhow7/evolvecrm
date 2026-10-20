import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useContacts,
  useActivities,
  useBoards,
  useLifecycleStages,
  useUpdateDeal,
  useDeleteDeal,
  useAddDealItem,
  useRemoveDealItem,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
} from '@/lib/query/hooks';
import { useUIState } from '@/store/uiState';
import { useActiveProducts } from '@/lib/query/hooks/useProductsQuery';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ConfirmDialog as ConfirmModal } from '@/components/ui/confirm-dialog';
import { LossReasonModal } from '@/components/ui/LossReasonModal';
import { useMoveDealSimple } from '@/lib/query/hooks';
import { DEALS_VIEW_KEY } from '@/lib/query';
import { FocusTrap, useFocusReturn } from '@/lib/a11y';
import { Activity, DealView } from '@/types';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useResponsiveMode } from '@/hooks/useResponsiveMode';
import { DealSheet } from '../DealSheet';
import {
  analyzeLead,
  generateEmailDraft,
  generateObjectionResponse,
} from '@/lib/ai/tasksClient';
import {
  BrainCircuit,
  Mail,
  Phone,
  Calendar,
  Check,
  X,
  Trash2,
  Pencil,
  ThumbsUp,
  ThumbsDown,
  Building2,
  User,
  Package,
  Sword,
  CheckCircle2,
  Bot,
  Tag as TagIcon,
  Plus,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StageProgressBar } from '../StageProgressBar';
import { ActivityRow } from '@/features/activities/components/ActivityRow';
import { formatPriorityPtBr } from '@/lib/utils/priority';
import { BriefingDrawer } from '@/features/deals/components/BriefingDrawer';
import { AIExtractedFields } from '@/features/deals/components/AIExtractedFields';
import { DealDocumentsTab } from './DealDocumentsTab';
import { AnalysisActions } from './AnalysisActions';
import { formatBRL } from '@/lib/utils/brFormat';

import { FIELD_INPUT_CLASS, FIELD_LABEL_CLASS } from '@/components/ui/modalStyles';
interface DealDetailModalProps {
  dealId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Performance: reuse date formatter instance.
const PT_BR_DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR');

/**
 * Componente React `DealDetailModal`.
 *
 * @param {DealDetailModalProps} { dealId, isOpen, onClose } - Parâmetro `{ dealId, isOpen, onClose }`.
 * @returns {Element | null} Retorna um valor do tipo `Element | null`.
 */
export const DealDetailModal: React.FC<DealDetailModalProps> = ({ dealId, isOpen, onClose }) => {
  // Accessibility: Unique ID for ARIA labelling
  const headingId = useId();

  // Accessibility: Return focus to trigger element when modal closes
  useFocusReturn({ enabled: isOpen });

  const { mode } = useResponsiveMode();
  const isMobile = mode === 'mobile';

  const updateDealMutation = useUpdateDeal();
  const deleteDealMutation = useDeleteDeal();
  const addDealItemMutation = useAddDealItem();
  const removeDealItemMutation = useRemoveDealItem();
  const updateDeal = (id: string, updates: Partial<import('@/types').Deal>) => updateDealMutation.mutateAsync({ id, updates });
  const deleteDeal = (id: string) => deleteDealMutation.mutateAsync(id);
  const addItemToDeal = (dealId: string, item: Omit<import('@/types').DealItem, 'id'>) => addDealItemMutation.mutateAsync({ dealId, item });
  const removeItemFromDeal = (dealId: string, itemId: string) => removeDealItemMutation.mutateAsync({ dealId, itemId });

  const { data: contacts = [] } = useContacts();
  const { data: activities = [] } = useActivities();
  const { data: boards = [] } = useBoards();
  const { activeBoardId } = useUIState();
  const activeBoard = boards.find(b => b.id === activeBoardId) || boards.find(b => b.isDefault) || boards[0] || null;
  const { data: lifecycleStages = [] } = useLifecycleStages();

  const createActivityMutation = useCreateActivity();
  const updateActivityMutation = useUpdateActivity();
  const deleteActivityMutation = useDeleteActivity();
  const addActivity = (activity: Omit<import('@/types').Activity, 'id' | 'createdAt'>) => createActivityMutation.mutateAsync({ activity });
  const updateActivity = (id: string, updates: Partial<import('@/types').Activity>) => updateActivityMutation.mutateAsync({ id, updates });
  const deleteActivity = (id: string) => deleteActivityMutation.mutateAsync(id);
  const { data: products = [] } = useActiveProducts();
  const customFieldDefinitions: import('@/types').CustomFieldDefinition[] = [];
  const { profile } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  // Subscribe to the same cache the Kanban uses (DEALS_VIEW_KEY).
  // This ensures newly-created deals (written there by the optimistic insert in CRMContext.addDeal)
  // are immediately visible to the modal, without waiting for Realtime to update ['deals', 'list'].
  const { data: allDeals = [] } = useQuery<DealView[]>({
    queryKey: DEALS_VIEW_KEY,
    queryFn: () => [] as DealView[], // never called — enabled: false; queryFn required by TanStack Query v5
    enabled: false, // don't trigger a new fetch — data is always hydrated by the Kanban's useDealsByBoard
  });

  // Performance: avoid repeated `find(...)` on large arrays.
  const dealsById = useMemo(() => new Map(allDeals.map((d) => [d.id, d])), [allDeals]);
  const contactsById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const boardsById = useMemo(() => new Map(boards.map((b) => [b.id, b])), [boards]);
  const lifecycleStageById = useMemo(() => new Map(lifecycleStages.map((s) => [s.id, s])), [lifecycleStages]);
  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const activitiesById = useMemo(() => new Map(activities.map((a) => [a.id, a])), [activities]);

  const deal = dealId ? dealsById.get(dealId) : undefined;
  const contact = deal ? (contactsById.get(deal.contactId) ?? null) : null;

  // Determine the correct board for this deal
  const dealBoard = deal ? (boardsById.get(deal.boardId) ?? activeBoard) : activeBoard;

  // Use unified TanStack Query hook for moving deals
  const { moveDeal } = useMoveDealSimple(dealBoard, lifecycleStages);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editValue, setEditValue] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [aiResult, setAiResult] = useState<{ suggestion: string; score: number } | null>(null);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'products' | 'info' | 'documentos'>('timeline');
  const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [objection, setObjection] = useState('');
  const [objectionResponses, setObjectionResponses] = useState<string[]>([]);
  const [isGeneratingObjections, setIsGeneratingObjections] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<string>('0');
  const [customItemQuantity, setCustomItemQuantity] = useState(1);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showLossReasonModal, setShowLossReasonModal] = useState(false);
  const [pendingLostStageId, setPendingLostStageId] = useState<string | null>(null);
  const [lossReasonOrigin, setLossReasonOrigin] = useState<'button' | 'stage'>('button');
  const [showBriefingDrawer, setShowBriefingDrawer] = useState(false);

  // Tags suggestions (local for now; Settings UI writes to the same key)
  const [availableTags, setAvailableTags] = usePersistedState<string[]>('crm_tags', []);
  const [tagQuery, setTagQuery] = useState('');

  const normalizeTag = (value: string) => value.trim().replace(/\s+/g, ' ');
  const tagsLower = useMemo(() => new Set((deal?.tags || []).map(t => t.toLowerCase())), [deal?.tags]);
  const availableTagsLower = useMemo(() => new Set((availableTags || []).map(t => t.toLowerCase())), [availableTags]);

  // Helper functions removed as they are now handled by ActivityRow component

  // Reset state when deal changes or modal opens
  useEffect(() => {
    if (isOpen && deal) {
      setEditTitle(deal.title);
      setEditValue(deal.value.toString());
      setAiResult(null);
      setEmailDraft(null);
      setObjectionResponses([]);
      setObjection('');
      setActiveTab('timeline');
      setIsEditingTitle(false);
      setIsEditingValue(false);
      setShowLossReasonModal(false);
      setPendingLostStageId(null);
      setLossReasonOrigin('button');
      setTagQuery('');
      setShowBriefingDrawer(false);
    }
  }, [isOpen, dealId]); // Depend on dealId to reset when switching deals

  // UX: preselect board's default product when opening the Products tab (non-invasive).
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab !== 'products') return;
    const defaultId = dealBoard?.defaultProductId;
    if (!defaultId) return;
    if (selectedProductId) return;
    // Only suggest if product exists & is active.
    const p = productsById.get(defaultId);
    if (!p || p.active === false) return;
    setSelectedProductId(defaultId);
    setProductQuantity(1);
  }, [activeTab, dealBoard?.defaultProductId, isOpen, productsById, selectedProductId]);

  // Pre-compute stage label once for tool prompts (avoid repeated stage lookup).
  const stageLabel = useMemo(() => {
    if (!dealBoard) return undefined;
    const stage = dealBoard.stages.find((s) => s.id === deal?.status);
    return stage?.label;
  }, [deal?.status, dealBoard]);

  // Performance: filter deal activities once per deal change (avoid filtering inside render).
  const dealActivities = useMemo(() => {
    if (!deal) return [] as Activity[];
    return activities.filter((a) => a.dealId === deal.id);
  }, [activities, deal]);

  if (!isOpen || !deal) return null;

  const addDealTag = (raw: string) => {
    const next = normalizeTag(raw);
    if (!next) return;
    if (tagsLower.has(next.toLowerCase())) return;

    const current = deal.tags || [];
    const nextTags = [...current, next];
    updateDeal(deal.id, { tags: nextTags });

    // Keep suggestions up-to-date (case-insensitive)
    if (!availableTagsLower.has(next.toLowerCase())) {
      setAvailableTags(prev => [...(prev || []), next]);
    }

    setTagQuery('');
  };

  const removeDealTag = (tag: string) => {
    const current = deal.tags || [];
    const nextTags = current.filter(t => t !== tag);
    updateDeal(deal.id, { tags: nextTags });
  };

  const tagSuggestions = (() => {
    const q = normalizeTag(tagQuery);
    if (!q) return [];
    const qLower = q.toLowerCase();
    return (availableTags || [])
      .filter(t => !tagsLower.has(t.toLowerCase()))
      .filter(t => t.toLowerCase().includes(qLower))
      .slice(0, 8);
  })();

  const handleAnalyzeDeal = async () => {
    setIsAnalyzing(true);
    try {
      // Performance: stageLabel memoized above.
      const result = await analyzeLead(deal, stageLabel);
      setAiResult({ suggestion: result.suggestion, score: result.probabilityScore });
      updateDeal(deal.id, { aiSummary: result.suggestion, probability: result.probabilityScore });
    } catch (error: any) {
      console.error('[DealDetailModal] analyzeLead failed:', error);
      addToast(
        error?.message || 'Falha ao analisar deal com IA. Verifique Configurações → Inteligência Artificial.',
        'warning'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDraftEmail = async () => {
    setIsDrafting(true);
    try {
      // Performance: stageLabel memoized above.
      const draft = await generateEmailDraft(deal, stageLabel);
      setEmailDraft(draft);
    } catch (error: any) {
      console.error('[DealDetailModal] generateEmailDraft failed:', error);
      addToast(
        error?.message || 'Falha ao gerar e-mail com IA. Verifique Configurações → Inteligência Artificial.',
        'warning'
      );
    } finally {
      setIsDrafting(false);
    }
  };


  const handleObjection = async () => {
    if (!objection.trim()) return;
    setIsGeneratingObjections(true);
    try {
      const responses = await generateObjectionResponse(deal, objection);
      setObjectionResponses(responses);
    } catch (error: any) {
      console.error('[DealDetailModal] generateObjectionResponse failed:', error);
      addToast(
        error?.message || 'Falha ao gerar respostas. Verifique Configurações → Inteligência Artificial.',
        'warning'
      );
    } finally {
      setIsGeneratingObjections(false);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const noteActivity: Activity = {
      id: crypto.randomUUID(),
      dealId: deal.id,
      dealTitle: deal.title,
      type: 'NOTE',
      title: 'Nota Adicionada',
      description: newNote,
      date: new Date().toISOString(),
      user: { name: 'Eu', avatar: 'https://i.pravatar.cc/150?u=me' },
      completed: true,
    };

    addActivity(noteActivity);
    setNewNote('');
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    // Performance: O(1) lookup instead of scanning all products.
    const product = productsById.get(selectedProductId);
    if (!product) return;

    addItemToDeal(deal.id, {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: productQuantity,
    });

    setSelectedProductId('');
    setProductQuantity(1);
  };

  const handleAddCustomItem = () => {
    const name = customItemName.trim();
    const price = Number(customItemPrice);
    const qty = Number(customItemQuantity);
    if (!name) {
      addToast('Digite o nome do item.', 'warning');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      addToast('Preço inválido.', 'warning');
      return;
    }
    if (!Number.isFinite(qty) || qty < 1) {
      addToast('Quantidade inválida.', 'warning');
      return;
    }

    // "Produto depende do cliente": item livre, sem product_id.
    addItemToDeal(deal.id, {
      productId: '', // deal_items.product_id é opcional no schema; sanitizeUUID('') => null
      name,
      price,
      quantity: qty,
    });

    setCustomItemName('');
    setCustomItemPrice('0');
    setCustomItemQuantity(1);
    setShowCustomItem(false);
  };

  const confirmDeleteDeal = () => {
    if (deleteId) {
      deleteDeal(deleteId);
      addToast('Negócio excluído com sucesso', 'success');
      setDeleteId(null);
      onClose();
    }
  };

  const saveTitle = () => {
    if (editTitle) {
      updateDeal(deal.id, { title: editTitle });
      setIsEditingTitle(false);
    }
  };

  const saveValue = () => {
    if (editValue) {
      updateDeal(deal.id, { value: Number(editValue) });
      setIsEditingValue(false);
    }
  };

  const updateCustomField = (key: string, value: string | number | boolean) => {
    const updatedFields = { ...deal.customFields, [key]: value };
    updateDeal(deal.id, { customFields: updatedFields });
  };

  // dealActivities memoized above.

  // Handle escape key to close modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isEditingTitle && !isEditingValue) {
      onClose();
    }
  };

  const inner = (
    <>
    <div
      className={
        isMobile
          ? 'bg-[var(--surface-card)] border border-[var(--border-hairline)] w-full h-[100dvh] flex flex-col overflow-hidden pb-[var(--app-safe-area-bottom,0px)]'
          : 'bg-[var(--surface-card)] border border-[var(--border-hairline)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200'
      }
    >
          {/* HEADER (Stage Bar + Won/Lost) */}
          <div className="bg-[var(--surface-sunken)] border-b border-[var(--border-hairline)] px-6 pt-6 pb-4 shrink-0">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
              <div className="flex-1 min-w-[16rem]">
                {isEditingTitle ? (
                  <div className="flex gap-2 mb-1">
                    <input
                      autoFocus
                      type="text"
                      className="text-2xl font-semibold text-[var(--text-primary)] bg-[var(--surface-card)] border border-[var(--border-hairline)] rounded-[var(--radius-md)] px-2 py-1 w-full outline-none focus:border-[var(--cyan-400)] focus:shadow-[var(--focus-ring)]"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={saveTitle}
                      onKeyDown={e => e.key === 'Enter' && saveTitle()}
                    />
                    <button onClick={saveTitle} className="text-green-500 hover:text-green-400">
                      <Check size={24} />
                    </button>
                  </div>
                ) : (
                  <h2
                    id={headingId}
                    onClick={() => {
                      setEditTitle(deal.title);
                      setIsEditingTitle(true);
                    }}
                    className="text-2xl font-semibold text-[var(--text-primary)] leading-tight cursor-pointer hover:text-[var(--text-accent)] flex items-center gap-2 group transition-colors"
                    title="Clique para editar"
                  >
                    {deal.title}
                    <Pencil size={16} className="opacity-0 group-hover:opacity-50 text-slate-400" />
                  </h2>
                )}

                {isEditingValue ? (
                  <div className="flex gap-2 items-center">
                    <span className="text-lg font-semibold text-[var(--text-secondary)]">R$</span>
                    <input
                      autoFocus
                      type="number"
                      className="text-lg font-semibold text-[var(--text-accent)] bg-[var(--surface-card)] border border-[var(--border-hairline)] rounded-[var(--radius-md)] px-2 py-1 w-32 outline-none focus:border-[var(--cyan-400)] focus:shadow-[var(--focus-ring)]"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={saveValue}
                      onKeyDown={e => e.key === 'Enter' && saveValue()}
                    />
                    <button onClick={saveValue} className="text-green-500 hover:text-green-400">
                      <Check size={20} />
                    </button>
                  </div>
                ) : (
                  deal.value > 0 ? (
                    <p
                      onClick={() => {
                        setEditValue(deal.value.toString());
                        setIsEditingValue(true);
                      }}
                      className="mt-1 text-base text-[var(--text-accent)] font-semibold cursor-pointer hover:underline decoration-dashed underline-offset-4"
                      title="Clique para editar os honorários"
                    >
                      Honorários: {formatBRL(deal.value)}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditValue('');
                        setIsEditingValue(true);
                      }}
                      className="mt-1 text-sm font-semibold text-[var(--text-accent)] hover:underline decoration-dashed underline-offset-4"
                    >
                      Definir honorários
                    </button>
                  )
                )}
              </div>
              <div className="flex gap-2 items-center">
                {/* Se fechado: mostra badge + botão Reabrir */}
                {(deal.isWon || deal.isLost) ? (
                  <>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-pill)] ${deal.isWon ? 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)]' : 'bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]'}`}>
                      {deal.isWon ? 'Contratou' : 'Não contratou'}
                    </span>
                    <button
                      onClick={() => {
                        // Find first non-won/lost stage to reopen to
                        const firstRegularStage = dealBoard?.stages.find(
                          s => s.linkedLifecycleStage !== 'CUSTOMER' && s.linkedLifecycleStage !== 'OTHER'
                        );
                        if (firstRegularStage) {
                          moveDeal(deal, firstRegularStage.id);
                        } else {
                          // Fallback: just clear the won/lost flags
                          updateDeal(deal.id, { isWon: false, isLost: false, closedAt: undefined });
                        }
                      }}
                      className="at-btn at-btn--secondary at-btn--sm"
                    >
                      Reabrir
                    </button>
                  </>
                ) : (
                  /* Se aberto: mostra botões Ganho e Perdido */
                  <>
                    <button
                      onClick={() => {
                        // Intelligent "Won" Logic:
                        // 0. Check for "Stay in Stage" flag (Archive/Close in place)
                        if (dealBoard?.wonStayInStage) {
                          moveDeal(deal, deal.status, undefined, true, false);
                          onClose();
                          return;
                        }

                        // 1. Check if board has explicit Won Stage configured
                        if (dealBoard?.wonStageId) {
                          moveDeal(deal, dealBoard.wonStageId);
                          onClose();
                          return;
                        }

                        // 2. Find the appropriate "Success Stage" for this board based on lifecycle
                        const successStage = dealBoard?.stages.find(
                          s => s.linkedLifecycleStage === 'CUSTOMER'
                        ) || dealBoard?.stages.find(
                          s => s.linkedLifecycleStage === 'MQL'
                        ) || dealBoard?.stages.find(
                          s => s.linkedLifecycleStage === 'SALES_QUALIFIED'
                        );

                        if (successStage) {
                          moveDeal(deal, successStage.id);
                        } else {
                          // Fallback: just mark as won without moving
                          updateDeal(deal.id, { isWon: true, isLost: false, closedAt: new Date().toISOString() });
                        }
                        onClose();
                      }}
                      className="at-btn at-btn--primary at-btn--sm"
                    >
                      <ThumbsUp size={14} aria-hidden="true" /> Contratou
                    </button>
                    <button
                      onClick={() => {
                        // 0. Check for "Stay in Stage" flag
                        if (dealBoard?.lostStayInStage) {
                          // We don't set pendingLostStageId because we aren't moving to a new stage ID
                          // But the modal logic relies on it? No, if pendingLostStageId is null, we might need another flag.
                          // Actually, let's keep it clean.
                          // setPendingLostStageId(deal.status); // Hack?
                          // Better: Just open modal, and handle logic in confirm.
                        }

                        // If board has explicit Lost Stage, queue it
                        if (dealBoard?.lostStageId) {
                          setPendingLostStageId(dealBoard.lostStageId);
                        }
                        setLossReasonOrigin('button');
                        setShowLossReasonModal(true);
                      }}
                      className="at-btn at-btn--secondary at-btn--sm"
                    >
                      <ThumbsDown size={14} aria-hidden="true" /> Não contratou
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowBriefingDrawer(true)}
                  className="at-btn at-btn--ghost at-btn--sm"
                  title="Preparar para a conversa com este lead"
                  aria-label="Preparar conversa com este lead"
                >
                  <FileText size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">Preparar</span>
                </button>
                <button
                  onClick={() => setDeleteId(deal.id)}
                  className="p-2 rounded-[var(--radius-pill)] text-[var(--text-tertiary)] hover:text-[var(--status-danger-fg)] hover:bg-[var(--status-danger-bg)] transition-colors"
                  title="Excluir negócio"
                  aria-label="Excluir negócio"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-[var(--radius-pill)] text-[var(--text-secondary)] hover:bg-[var(--surface-card)] transition-colors"
                  aria-label="Fechar modal"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
            </div>

            {dealBoard ? (
              <StageProgressBar
                stages={dealBoard.stages}
                currentStatus={deal.status}
                variant="timeline"
                onStageClick={stageId => {
                  // Check if clicking on a LOST stage
                  const targetStage = dealBoard.stages.find(s => s.id === stageId);
                  // Check if it matches configured Lost Stage OR explicitly linked 'OTHER' stage
                  const isLostStage =
                    dealBoard.lostStageId === stageId ||
                    targetStage?.linkedLifecycleStage === 'OTHER';

                  if (isLostStage) {
                    // Show loss reason modal
                    setPendingLostStageId(stageId);
                    setLossReasonOrigin('stage');
                    setShowLossReasonModal(true);
                  } else {
                    // Regular move
                    moveDeal(deal, stageId);
                  }
                }}
              />
            ) : (
              <div className="mt-4 rounded-lg border border-slate-200/60 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Funil não encontrado para este negócio. Mover de etapa pode não funcionar.
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Left Sidebar (Static Info + Custom Fields) */}
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-[var(--border-hairline)] p-4 sm:p-6 overflow-y-auto bg-[var(--surface-card)] max-h-[38vh] md:max-h-none">
              <div className="space-y-6">
                {deal.companyName && deal.companyName !== 'Sem empresa' && (
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                      <Building2 size={14} /> Empresa
                    </h3>
                    <p className="text-[var(--text-primary)] font-medium">{deal.companyName}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                    <User size={14} /> Contato
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-full bg-[var(--surface-accent)] text-[var(--text-accent)] flex items-center justify-center text-sm font-semibold">
                      {(deal.contactName || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-primary)] font-medium text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
                        {deal.contactName || 'Sem contato'}
                        {contact?.stage &&
                          (() => {
                            const stage = lifecycleStageById.get(contact.stage);
                            if (!stage) return null;

                            // Extract base color name (e.g. 'blue' from 'bg-blue-500')
                            const colorClass = stage.color; // e.g. bg-blue-500
                            // We need to construct text and ring classes dynamically or just use inline styles/safe list
                            // For now, let's just use the background color provided and white text

                            return (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-[var(--radius-pill)] flex items-center gap-1 text-white ${colorClass}`}
                              >
                                {stage.name}
                              </span>
                            );
                          })()}
                      </p>
                      {deal.contactEmail && <p className="text-[var(--text-tertiary)] text-xs truncate">{deal.contactEmail}</p>}
                    </div>
                    {/* Send Message Button */}
                    {contact?.phone && (
                      <button
                        type="button"
                        onClick={() => {
                          // Navigate to messaging with contact info for new conversation
                          const params = new URLSearchParams({
                            newConversation: 'true',
                            contactId: contact.id,
                            contactName: contact.name || '',
                            contactPhone: contact.phone || '',
                          });
                          router.push(`/messaging?${params.toString()}`);
                          onClose();
                        }}
                        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[var(--status-success-fg)] bg-[var(--status-success-bg)] hover:opacity-90 rounded-[var(--radius-pill)] transition-colors"
                        title="Enviar mensagem via WhatsApp"
                      >
                        <MessageSquare size={14} />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-hairline)]">
                  <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Detalhes</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Prioridade</span>
                      <span className="text-[var(--text-primary)]">
                        {formatPriorityPtBr(deal.priority)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Criado em</span>
                      <span className="text-[var(--text-primary)]">
                        {PT_BR_DATE_FORMATTER.format(new Date(deal.createdAt))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TAGS */}
                <div className="pt-4 border-t border-[var(--border-hairline)]">
                  <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                    <TagIcon size={14} /> Etiquetas
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {(deal.tags || []).length === 0 ? (
                      <p className="text-xs text-[var(--text-tertiary)]">Nenhuma etiqueta.</p>
                    ) : (
                      (deal.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-[var(--radius-pill)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] border border-[var(--border-hairline)]"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeDealTag(tag)}
                            className="ml-0.5 text-[var(--text-tertiary)] hover:text-[var(--status-danger-fg)]"
                            aria-label={`Remover tag ${tag}`}
                            title="Remover tag"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagQuery}
                        onChange={(e) => setTagQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addDealTag(tagQuery);
                          }
                        }}
                        placeholder="Nova etiqueta (ex.: urgente)"
                        className={`${FIELD_INPUT_CLASS} min-w-0 flex-1`}
                        aria-label="Adicionar tag"
                      />
                      <button
                        type="button"
                        onClick={() => addDealTag(tagQuery)}
                        disabled={!normalizeTag(tagQuery)}
                        className="at-btn at-btn--primary shrink-0 h-11 w-11 !px-0"
                        aria-label="Adicionar tag"
                        title="Adicionar tag"
                      >
                        <Plus size={18} aria-hidden="true" />
                      </button>
                    </div>

                    {(normalizeTag(tagQuery) && tagSuggestions.length > 0) && (
                      <div className="mt-2 bg-[var(--surface-card)] border border-[var(--border-hairline)] rounded-[var(--radius-lg)] overflow-hidden">
                        {tagSuggestions.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => addDealTag(t)}
                            className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI EXTRACTED FIELDS (Zero Config BANT) */}
                <div className="pt-4 border-t border-[var(--border-hairline)]">
                  <AIExtractedFields
                    data={deal.aiExtracted as import('@/lib/ai/extraction/schemas').AIExtractedData | undefined}
                    compact
                  />
                </div>

                {/* DYNAMIC CUSTOM FIELDS INPUTS */}
                {customFieldDefinitions.length > 0 && (
                  <div className="pt-4 border-t border-[var(--border-hairline)]">
                    <h3 className="text-xs font-semibold text-[var(--text-secondary)] mb-3">
                      Campos personalizados
                    </h3>
                    <div className="space-y-4">
                      {customFieldDefinitions.map(field => (
                        <div key={field.id}>
                          <label className={FIELD_LABEL_CLASS}>
                            {field.label}
                          </label>
                          {field.type === 'select' ? (
                            <select
                              value={deal.customFields?.[field.key] || ''}
                              onChange={e => updateCustomField(field.key, e.target.value)}
                              className={FIELD_INPUT_CLASS}
                            >
                              <option value="">Selecione...</option>
                              {field.options?.map(opt => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={deal.customFields?.[field.key] || ''}
                              onChange={e => updateCustomField(field.key, e.target.value)}
                              className={FIELD_INPUT_CLASS}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Content (Tabs & Timeline) */}
            <div className="flex-1 min-h-0 flex flex-col bg-[var(--surface-card)]">
              <div className="h-14 border-b border-[var(--border-hairline)] flex items-center px-6 shrink-0 overflow-x-auto">
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`text-sm h-14 shrink-0 border-b-2 transition-colors ${activeTab === 'timeline' ? 'border-[var(--cyan-500)] text-[var(--text-primary)] font-semibold' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    Histórico
                  </button>
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`text-sm h-14 shrink-0 border-b-2 transition-colors ${activeTab === 'products' ? 'border-[var(--cyan-500)] text-[var(--text-primary)] font-semibold' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    Serviços
                  </button>
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`text-sm h-14 shrink-0 border-b-2 transition-colors ${activeTab === 'info' ? 'border-[var(--cyan-500)] text-[var(--text-primary)] font-semibold' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    Análise da IA
                  </button>
                  <button
                    onClick={() => setActiveTab('documentos')}
                    className={`text-sm h-14 shrink-0 border-b-2 transition-colors ${activeTab === 'documentos' ? 'border-[var(--cyan-500)] text-[var(--text-primary)] font-semibold' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    Documentos
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-[var(--surface-sunken)]">
                {dealBoard?.stages.find(st => st.id === deal.status)?.role === 'analise_documentos' && (
                  <AnalysisActions
                    deal={deal}
                    board={dealBoard}
                    onNotFollow={() => {
                      setLossReasonOrigin('button');
                      setShowLossReasonModal(true);
                    }}
                  />
                )}
                {activeTab === 'documentos' && <DealDocumentsTab dealId={deal.id} />}
                {activeTab === 'timeline' && (
                  <div className="space-y-6">
                    <div className="bg-[var(--surface-card)] border border-[var(--border-hairline)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-xs)] focus-within:border-[var(--cyan-400)] focus-within:shadow-[var(--focus-ring)] transition-colors">
                      <textarea
                        ref={noteTextareaRef}
                        className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none resize-none min-h-[72px]"
                        placeholder="Anotar algo sobre o caso..."
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                      ></textarea>
                      <div className="flex justify-end items-center mt-2">
                        <div />
                        <button
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                          className="at-btn at-btn--primary at-btn--sm"
                        >
                          <Check size={14} aria-hidden="true" /> Salvar nota
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 pl-4 border-l border-[var(--border-hairline)]">
                      {dealActivities.length === 0 && (
                        <p className="text-sm text-[var(--text-tertiary)] pl-4">
                          Nada registrado ainda.
                        </p>
                      )}
                      {dealActivities.map(activity => (
                        <ActivityRow
                          key={activity.id}
                          activity={activity}
                          deal={deal}
                          onToggleComplete={id => {
                            // Performance: O(1) lookup instead of scanning all activities.
                            const act = activitiesById.get(id);
                            if (act) updateActivity(id, { completed: !act.completed });
                          }}
                          onEdit={() => { }} // Edit not implemented in modal yet
                          onDelete={id => deleteActivity(id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                        <Package size={16} /> Adicionar Produto/Serviço
                      </h3>
                      <div className="flex gap-3">
                        <select
                          className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                          value={selectedProductId}
                          onChange={e => setSelectedProductId(e.target.value)}
                        >
                          <option value="">Selecione um item...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} - ${p.price}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          className="w-20 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                          value={productQuantity}
                          onChange={e => setProductQuantity(parseInt(e.target.value))}
                        />
                        <button
                          onClick={handleAddProduct}
                          disabled={!selectedProductId}
                          className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                          Adicionar
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Produto depende do cliente? Use um item personalizado (não precisa estar no catálogo).
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCustomItem(v => !v)}
                          className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {showCustomItem ? 'Fechar' : 'Adicionar item personalizado'}
                        </button>
                      </div>

                      {showCustomItem && (
                        <div className="mt-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                            <div className="sm:col-span-6">
                              <label className={FIELD_LABEL_CLASS}>Nome do item</label>
                              <input
                                value={customItemName}
                                onChange={e => setCustomItemName(e.target.value)}
                                placeholder="Ex.: Pacote personalizado, Procedimento X…"
                                className={FIELD_INPUT_CLASS}
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className={FIELD_LABEL_CLASS}>Preço</label>
                              <input
                                value={customItemPrice}
                                onChange={e => setCustomItemPrice(e.target.value)}
                                inputMode="decimal"
                                className={FIELD_INPUT_CLASS}
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className={FIELD_LABEL_CLASS}>Qtd</label>
                              <input
                                type="number"
                                min={1}
                                value={customItemQuantity}
                                onChange={e => setCustomItemQuantity(parseInt(e.target.value))}
                                className={FIELD_INPUT_CLASS}
                              />
                            </div>
                            <div className="sm:col-span-1">
                              <button
                                type="button"
                                onClick={handleAddCustomItem}
                                className="w-full bg-primary-600 hover:bg-primary-500 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-black/20 border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 font-medium">
                          <tr>
                            <th className="px-4 py-3">Item</th>
                            <th className="px-4 py-3 w-20 text-center">Qtd</th>
                            <th className="px-4 py-3 w-32 text-right">Preço Unit.</th>
                            <th className="px-4 py-3 w-32 text-right">Total</th>
                            <th className="px-4 py-3 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {!deal.items || deal.items.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">
                                Nenhum produto adicionado. O valor do negócio é manual.
                              </td>
                            </tr>
                          ) : (
                            deal.items.map(item => (
                              <tr key={item.id}>
                                <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                                  {item.name}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                                  ${item.price.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                                  ${(item.price * item.quantity).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => removeItemFromDeal(deal.id, item.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-black/20 border-t border-slate-200 dark:border-white/5">
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-3 text-right font-semibold text-[var(--text-secondary)] text-xs"
                            >
                              Total
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-primary-600 dark:text-primary-400 text-lg">
                              {formatBRL(deal.value)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'info' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-linear-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-dark-card p-6 rounded-xl border border-primary-100 dark:border-primary-500/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary-100 dark:bg-primary-500/20 rounded-lg text-primary-600 dark:text-primary-400">
                          <BrainCircuit size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white font-display text-lg">
                            Análise da IA
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            O que a IA percebeu neste caso
                          </p>
                        </div>
                      </div>

                      {/* STRATEGY CONTEXT BAR */}
                      {dealBoard?.agentPersona && (
                        <div className="mb-6 bg-slate-900/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                            <Bot size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                                Atuando como
                              </span>
                            </div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                              {dealBoard.agentPersona?.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {dealBoard.agentPersona?.role} • Foco: {dealBoard.goal?.kpi || 'Geral'}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3 mb-5">
                        <button
                          onClick={handleAnalyzeDeal}
                          disabled={isAnalyzing}
                          className="flex-1 py-2.5 bg-white dark:bg-white/5 text-slate-700 dark:text-white text-sm font-medium rounded-lg shadow-sm border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                        >
                          {isAnalyzing ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <BrainCircuit size={16} />
                          )}
                          Analisar Negócio
                        </button>
                        <button
                          onClick={handleDraftEmail}
                          disabled={isDrafting}
                          className="flex-1 py-2.5 bg-white dark:bg-white/5 text-slate-700 dark:text-white text-sm font-medium rounded-lg shadow-sm border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                        >
                          {isDrafting ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <Mail size={16} />
                          )}
                          Escrever Email
                        </button>
                      </div>
                      {aiResult && (
                        <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md p-4 rounded-lg border border-primary-100 dark:border-primary-500/20 mb-4">
                          <div className="flex justify-between mb-2 border-b border-primary-100 dark:border-white/5 pb-2">
                            <span className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                              Sugestão
                            </span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 rounded">
                              {aiResult.score}% Chance
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                            {aiResult.suggestion}
                          </p>
                        </div>
                      )}
                      {emailDraft && (
                        <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md p-4 rounded-lg border border-primary-100 dark:border-primary-500/20">
                          <h4 className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider mb-2">
                            Rascunho de Email
                          </h4>
                          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed italic">
                            "{emailDraft}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-xl border border-rose-100 dark:border-rose-500/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400">
                          <Sword size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white font-display text-lg">
                            Objection Killer
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            O cliente está difícil? A IA te ajuda a negociar.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          className="flex-1 bg-white dark:bg-white/5 border border-rose-200 dark:border-rose-500/20 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
                          placeholder="Ex: 'Achamos o preço muito alto' ou 'Preciso falar com meu sócio'"
                          value={objection}
                          onChange={e => setObjection(e.target.value)}
                        />
                        <button
                          onClick={handleObjection}
                          disabled={isGeneratingObjections || !objection.trim()}
                          className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                        >
                          {isGeneratingObjections ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            'Gerar Respostas'
                          )}
                        </button>
                      </div>

                      {objectionResponses.length > 0 && (
                        <div className="space-y-3">
                          {objectionResponses.map((resp, idx) => (
                            <div
                              key={idx}
                              className="bg-white dark:bg-white/5 p-3 rounded-lg border border-rose-100 dark:border-rose-500/10 flex gap-3"
                            >
                              <div className="shrink-0 w-6 h-6 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-xs">
                                {idx + 1}
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-200">{resp}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        <ConfirmModal
          isOpen={Boolean(deleteId)}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDeleteDeal}
          title="Excluir Negócio"
          message="Tem certeza que deseja excluir este negócio? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          variant="danger"
        />

        <LossReasonModal
          isOpen={showLossReasonModal}
          onClose={() => {
            setShowLossReasonModal(false);
            setPendingLostStageId(null);
            setLossReasonOrigin('button');
          }}
          onConfirm={(reason) => {
            // Priority:
            // 0. Stay in stage flag (Archive)
            // 1. Pending Stage (if set via click or explicit button)
            // 2. Explicit Lost Stage on Board
            // 3. Stage linked to 'OTHER' lifecycle

            if (dealBoard?.lostStayInStage) {
              moveDeal(deal, deal.status, reason, false, true); // explicitLost = true
              setShowLossReasonModal(false);
              setPendingLostStageId(null);
              if (lossReasonOrigin === 'button') onClose();
              return;
            }

            let targetStageId = pendingLostStageId;

            if (!targetStageId && dealBoard?.lostStageId) {
              targetStageId = dealBoard.lostStageId;
            }

            if (!targetStageId) {
              targetStageId =
                dealBoard?.stages.find(s => s.linkedLifecycleStage === 'OTHER')?.id ?? null;
            }

            if (targetStageId) {
              moveDeal(deal, targetStageId, reason);
            } else {
              // Fallback: just mark as lost without moving
              updateDeal(deal.id, { isLost: true, isWon: false, closedAt: new Date().toISOString(), lossReason: reason });
            }
            setShowLossReasonModal(false);
            setPendingLostStageId(null);
            // Only close the deal modal if it was triggered via the "PERDIDO" button
            if (lossReasonOrigin === 'button') onClose();
          }}
          dealTitle={deal.title}
        />

        <BriefingDrawer
          dealId={deal.id}
          dealTitle={deal.title}
          isOpen={showBriefingDrawer}
          onClose={() => setShowBriefingDrawer(false)}
        />
    </>
  );

  if (isMobile) {
    return (
      <DealSheet isOpen={isOpen} onClose={onClose} ariaLabel={`Negócio: ${deal.title}`}>
        <div onKeyDown={handleKeyDown}>{inner}</div>
      </DealSheet>
    );
  }

  return (
    <FocusTrap active={isOpen} onEscape={onClose}>
      <div
        // Backdrop + positioning wrapper. Clicking outside the panel should close the modal.
        // No desktop, este modal não deve cobrir a sidebar de navegação.
        // Em md+ deslocamos o overlay pela largura da sidebar via `--app-sidebar-width`.
        className="fixed inset-0 md:left-[var(--app-sidebar-width,0px)] z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onKeyDown={handleKeyDown}
        onClick={(e) => {
          // Only close when clicking the backdrop, not when clicking inside the panel.
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {inner}
      </div>
    </FocusTrap>
  );
};
