import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Phone,
  Calendar,
  Mail,
  CheckCircle2,
  FileText,
  AlertTriangle,
  UserX,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { FocusItem, AISuggestion } from '../hooks/useInboxController';
import { Activity, DealView } from '@/types';
import { FocusContextPanel } from './FocusContextPanel';
import { useUIState } from '@/store/uiState';
import {
  useDealsView,
  useContacts,
  useBoards,
  useActivities,
  useUpdateDeal,
  useCreateActivity,
  useUpdateActivity,
  useMoveDealSimple,
} from '@/lib/query/hooks';
import { useAuth } from '@/context/AuthContext';
import { InboxZeroState } from './InboxZeroState';
import { Badge, Button, IconButton } from '@/design-system';
import { formatBRL } from '@/lib/utils/brFormat';

// Performance: reuse Intl formatter instances (avoid per-render allocations).
const PT_BR_TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
const PT_BR_WHEN_FORMATTER = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' });

const ACTIVITY_TYPE_LABEL: Partial<Record<Activity['type'], string>> = {
  CALL: 'Ligação',
  MEETING: 'Reunião',
  EMAIL: 'E-mail',
  TASK: 'Tarefa',
  NOTE: 'Nota',
};

const SUGGESTION_TYPE_LABEL: Record<AISuggestion['type'], string> = {
  STALLED: 'Negócio parado',
  RESCUE: 'Cliente sem contato',
  UPSELL: 'Novo serviço',
};

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[6px] border border-[var(--border-hairline)] bg-[var(--surface-card)] px-1.5 font-sans text-[11px] text-[var(--text-secondary)]">
    {children}
  </kbd>
);

function normalizeTitleKey(value: string) {
  // UX: normalize titles for robust matching (trim/collapse whitespace/remove quotes).
  return value
    .trim()
    .toLowerCase()
    .replace(/[“”"]/g, '')
    .replace(/\s+/g, ' ');
}

function tryExtractContactNameFromText(text?: string) {
  if (!text) return '';

  // Common patterns in the app (pt-BR):
  // - "Ligar para o cliente Amanda Ribeiro"
  // - "Reativar cliente: Amanda Ribeiro"
  const match =
    text.match(/cliente:\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i)
    || text.match(/cliente\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i);

  return match?.[1] ?? '';
}

interface InboxFocusViewProps {
  currentItem: FocusItem | null;
  currentIndex: number;
  totalItems: number;
  onDone: () => void;
  onSnooze: () => void;
  onSkip: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Componente React `InboxFocusView`.
 *
 * @param {InboxFocusViewProps} {
  currentItem,
  currentIndex,
  totalItems,
  onDone,
  onSnooze,
  onSkip,
  onPrev,
  onNext,
} - Parâmetro `{
  currentItem,
  currentIndex,
  totalItems,
  onDone,
  onSnooze,
  onSkip,
  onPrev,
  onNext,
}`.
 * @returns {Element} Retorna um valor do tipo `Element`.
 */
export const InboxFocusView: React.FC<InboxFocusViewProps> = ({
  currentItem,
  currentIndex,
  totalItems,
  onDone,
  onSnooze,
  onSkip,
  onPrev,
  onNext,
}) => {
  const [showContext, setShowContext] = useState(false);
  const [manualDealId, setManualDealId] = useState('');
  const [contextSearch, setContextSearch] = useState('');
  const { data: deals = [] } = useDealsView();
  const { data: contacts = [] } = useContacts();
  const { data: boards = [] } = useBoards();
  const { data: activities = [] } = useActivities();
  const { activeBoardId } = useUIState();
  const activeBoard = boards.find(b => b.id === activeBoardId) || boards.find(b => b.isDefault) || boards[0] || null;
  const updateDealMutation = useUpdateDeal();
  const createActivityMutation = useCreateActivity();
  const updateActivityMutation = useUpdateActivity();
  const updateDeal = (id: string, updates: Partial<import('@/types').Deal>) => updateDealMutation.mutateAsync({ id, updates });
  const addActivity = (activity: Omit<import('@/types').Activity, 'id' | 'createdAt'>) => createActivityMutation.mutateAsync({ activity });
  const updateActivity = (id: string, updates: Partial<import('@/types').Activity>) => updateActivityMutation.mutateAsync({ id, updates });
  const { setSidebarCollapsed } = useUIState();
  const { profile } = useAuth();

  useEffect(() => {
    // UX: when moving between items, reset any manual context selection.
    setManualDealId('');
    setContextSearch('');
  }, [currentItem?.id]);

  // Performance: build lookup maps once to avoid repeated `.find(...)` in `contextData`.
  const dealsById = useMemo(() => new Map(deals.map(d => [d.id, d])), [deals]);
  // UX: alguns itens (ex.: atividades) podem vir sem `dealId` mas com `dealTitle`.
  // Criamos um lookup por título para conseguir abrir o painel “Ver detalhes”.
  const dealsByTitleKey = useMemo(() => {
    const map = new Map<string, DealView[]>();
    for (const d of deals) {
      const key = normalizeTitleKey(d.title ?? '');
      if (!key) continue;
      const list = map.get(key);
      if (list) list.push(d);
      else map.set(key, [d]);
    }
    return map;
  }, [deals]);
  const contactsById = useMemo(() => new Map(contacts.map(c => [c.id, c])), [contacts]);
  const boardsById = useMemo(() => new Map(boards.map(b => [b.id, b])), [boards]);

  /**
   * Performance: group & sort activities by dealId once.
   * Avoid `activities.filter(...).sort(...)` every time the focused item changes.
   */
  const activitiesByDealIdSorted = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of activities) {
      if (!a.dealId) continue;
      const list = map.get(a.dealId);
      if (list) list.push(a);
      else map.set(a.dealId, [a]);
    }
    for (const [dealId, list] of map) {
      list.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
      map.set(dealId, list);
    }
    return map;
  }, [activities]);

  // Context data for Cockpit
  const contextData = useMemo(() => {
    if (!currentItem) return null;

    let dealId = manualDealId || '';
    let contactId = '';
    let extractedContactName = '';

    if (currentItem.type === 'activity') {
      const act = currentItem.data as Activity;
      dealId = dealId || act.dealId || '';
      // Fallback: muitas telas exibem apenas `dealTitle` mesmo quando `dealId` está vazio.
      // Tentamos resolver o deal por título para permitir abrir o painel de contexto.
      if (!dealId && act.dealTitle) {
        const key = normalizeTitleKey(act.dealTitle);
        const matches = dealsByTitleKey.get(key);
        if (matches && matches.length > 0) {
          dealId = matches[0].id;
        }
      }

      // Tenta extrair nome do contato da descrição (ex: "O cliente Amanda Ribeiro não compra...")
      extractedContactName =
        tryExtractContactNameFromText(act.description)
        || tryExtractContactNameFromText(act.title)
        || '';

      // Também tenta no título (ex: "... para Amanda Ribeiro")
      if (!extractedContactName) {
        const titleMatch = act.title?.match(/para\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i);
        if (titleMatch) extractedContactName = titleMatch[1];
      }
    } else {
      const sugg = currentItem.data as AISuggestion;
      dealId = dealId || sugg.data.deal?.id || '';
      contactId = sugg.data.contact?.id || '';
    }

    const deal = dealId ? dealsById.get(dealId) : undefined;

    // Busca contato por ID, por contactId do deal, ou pelo nome extraído
    const primaryContactId = contactId || deal?.contactId || '';
    let contact = primaryContactId ? contactsById.get(primaryContactId) : undefined;
    if (!contact && extractedContactName) {
      const needle = extractedContactName.toLowerCase();
      contact = contacts.find(c => c.name?.toLowerCase().includes(needle));
    }

    const dealActivities = deal ? (activitiesByDealIdSorted.get(deal.id) ?? []) : [];
    const board = deal ? (boardsById.get(deal.boardId) ?? null) : activeBoard;

    // Se não tem deal mas tem contact, cria um placeholder para o Cockpit
    const nowIso = new Date().toISOString();
    const placeholderDeal = !deal && contact ? {
      id: `placeholder-${contact.id}`,
      title: `Reativar: ${contact.name}`,
      contactId: contact.id,
      boardId: activeBoard?.id || '',
      value: contact.totalValue || 0,
      status: activeBoard?.stages[0]?.id || '',
      isWon: false,
      isLost: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      probability: 30,
      priority: 'medium' as const,
      owner: { name: 'Eu', avatar: '' },
      tags: ['Resgate'],
      items: [],
    } : null;

    return {
      deal: deal || placeholderDeal,
      contact,
      activities: dealActivities,
      board,
      isPlaceholder: !deal && !!placeholderDeal
    };
  }, [currentItem, manualDealId, dealsById, dealsByTitleKey, contactsById, contacts, activitiesByDealIdSorted, boardsById, activeBoard]);

  const { moveDeal } = useMoveDealSimple(contextData?.board ?? null, []);

  const handleMoveStage = (stageId: string) => contextData?.deal && moveDeal(contextData.deal, stageId);
  const handleMarkWon = () => contextData?.deal && updateDeal(contextData.deal.id, { isWon: true, isLost: false, closedAt: new Date().toISOString() });
  const handleMarkLost = () => contextData?.deal && updateDeal(contextData.deal.id, { isWon: false, isLost: true, closedAt: new Date().toISOString() });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIndex > 0) onPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentIndex < totalItems - 1) onNext();
          break;
        case 'Enter':
          e.preventDefault();
          onDone();
          break;
        case ' ': // Space bar
          e.preventDefault();
          setShowContext(!showContext);
          break;
        case 'Escape':
          if (showContext) setShowContext(false);
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          onSnooze();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          onSkip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalItems, showContext, contextData, onPrev, onNext, onSnooze, onSkip, onDone]);

  useEffect(() => {
    setSidebarCollapsed(showContext);
  }, [showContext, setSidebarCollapsed]);

  const normalizedContextSearch = normalizeTitleKey(contextSearch);
  const suggestedDeals = useMemo(() => {
    // UX: if the activity has no deal/contact context (common in generic tasks),
    // allow the user to manually link a deal to bring back the Cockpit panel.
    if (!normalizedContextSearch) return deals.slice(0, 12);
    const results: DealView[] = [];
    for (const d of deals) {
      const key = normalizeTitleKey(d.title ?? '');
      if (!key) continue;
      if (key.includes(normalizedContextSearch)) results.push(d);
      if (results.length >= 12) break;
    }
    return results;
  }, [deals, normalizedContextSearch]);

  if (!currentItem) {
    return <InboxZeroState />;
  }

  const isActivity = currentItem.type === 'activity';
  const activity = isActivity ? (currentItem.data as Activity) : null;
  const suggestion = !isActivity ? (currentItem.data as AISuggestion) : null;

  // Determinar se é atrasado
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isOverdue = activity ? Date.parse(activity.date) < startOfToday.getTime() : false;

  // Ícone baseado no tipo
  const getIcon = () => {
    if (activity) {
      switch (activity.type) {
        case 'CALL': return <Phone size={18} />;
        case 'MEETING': return <Calendar size={18} />;
        case 'EMAIL': return <Mail size={18} />;
        case 'TASK': return <CheckCircle2 size={18} />;
        default: return <FileText size={18} />;
      }
    }
    if (suggestion) {
      switch (suggestion.type) {
        case 'STALLED': return <AlertTriangle size={18} />;
        case 'RESCUE': return <UserX size={18} />;
        case 'UPSELL': return <TrendingUp size={18} />;
        default: return <AlertTriangle size={18} />;
      }
    }
    return <FileText size={18} />;
  };

  // Cor do ícone
  const getIconColor = () => {
    if (isOverdue) return 'text-[var(--status-danger-fg)]';
    if (activity) {
      switch (activity.type) {
        case 'CALL': return 'text-blue-500';
        case 'MEETING': return 'text-purple-500';
        default: return 'text-slate-500';
      }
    }
    if (suggestion) {
      switch (suggestion.type) {
        case 'STALLED': return 'text-orange-500';
        case 'RESCUE': return 'text-red-500';
        case 'UPSELL': return 'text-green-500';
        default: return 'text-slate-500';
      }
    }
    return 'text-slate-500';
  };

  // Título e descrição
  const title = activity?.title || suggestion?.title || '';
  const description = activity?.description || suggestion?.description || '';
  // Sugestões já trazem contato, etapa e valor na descrição.
  const context = activity?.dealTitle || '';

  // Horário (se for reunião/call)
  const isMeeting = activity?.type === 'MEETING' || activity?.type === 'CALL';
  const timeString = activity ? PT_BR_TIME_FORMATTER.format(new Date(activity.date)) : '';
  const hasResolvedContext = !!(contextData?.deal || contextData?.contact);

  // Hierarquia: em sugestão, a pessoa é o destaque e o motivo vem embaixo.
  const suggestionDeal = suggestion?.data.deal;
  const suggestionContact = suggestion?.data.contact;
  const headline = suggestion
    ? (suggestionDeal?.contactName || suggestionContact?.name || suggestionDeal?.title || suggestion.description || title)
    : title;
  const subline = suggestion ? title : description;

  // Faixa de dados do item (só o que existe).
  const facts: Array<{ label: string; value: string }> = [];
  if (suggestionDeal) {
    if (suggestionDeal.stageLabel) facts.push({ label: 'Etapa', value: suggestionDeal.stageLabel });
    if (suggestionDeal.title && suggestionDeal.title !== headline) facts.push({ label: 'Negócio', value: suggestionDeal.title });
    facts.push({ label: 'Honorários', value: suggestionDeal.value > 0 ? formatBRL(suggestionDeal.value) : 'Não definidos' });
  } else if (suggestionContact?.phone) {
    facts.push({ label: 'Telefone', value: suggestionContact.phone });
  }
  if (activity) {
    facts.push({ label: 'Quando', value: `${PT_BR_WHEN_FORMATTER.format(new Date(activity.date))}, ${timeString}` });
    if (activity.dealTitle) facts.push({ label: 'Negócio', value: activity.dealTitle });
  }
  const typeLabel = activity
    ? (ACTIVITY_TYPE_LABEL[activity.type] ?? 'Atividade')
    : (suggestion ? SUGGESTION_TYPE_LABEL[suggestion.type] : '');
  const doneLabel = activity
    ? 'Concluir'
    : suggestion?.type === 'UPSELL' ? 'Criar negócio' : 'Criar tarefa';
  const progress = totalItems > 0 ? ((currentIndex + 1) / totalItems) * 100 : 0;

  return (
    <div className="mx-auto w-full max-w-3xl py-6 animate-fade-in">
      {/* Progresso + navegação */}
      <div className="mb-4 flex items-center gap-3">
        <span className="shrink-0 text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">{currentIndex + 1}</span> de {totalItems}
        </span>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-sunken)]"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={totalItems}
          aria-valuenow={currentIndex + 1}
          aria-label="Progresso da fila"
        >
          <div className="h-full rounded-full bg-[var(--cyan-500)] transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        <nav aria-label="Navegação entre itens" className="flex shrink-0 items-center gap-1">
          <IconButton icon="chevron-left" label="Item anterior" variant="ghost" size="sm" round onClick={onPrev} disabled={currentIndex === 0} />
          <IconButton icon="chevron-right" label="Próximo item" variant="ghost" size="sm" round onClick={onNext} disabled={currentIndex >= totalItems - 1} />
        </nav>
      </div>

      {/* Cartão do item */}
      <article className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-hairline)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]">
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-sunken)] ${getIconColor()}`} aria-hidden="true">
              {getIcon()}
            </span>
            <span className="text-base font-medium text-[var(--text-secondary)]">{typeLabel}</span>
            {isOverdue && <Badge tone="danger" size="sm">Atrasada</Badge>}
            {suggestion?.priority === 'high' && <Badge tone="warning" size="sm">Prioritário</Badge>}
            {activity && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                <Clock size={14} aria-hidden="true" />
                <span className="font-semibold text-[var(--text-primary)]">{timeString}</span>
              </span>
            )}
          </div>

          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.02em] text-[var(--text-primary)] sm:text-4xl">
            {headline}
          </h1>

          {subline && (
            <p className="mt-3 max-w-prose text-lg leading-relaxed text-[var(--text-secondary)]">
              {subline}
            </p>
          )}

          {facts.length > 0 ? (
            <dl className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--border-hairline)] sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label} className="bg-[var(--surface-sunken)] px-4 py-3">
                  <dt className="text-xs text-[var(--text-tertiary)]">{fact.label}</dt>
                  <dd className="mt-1 truncate text-sm font-medium text-[var(--text-primary)]">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border-hairline)] px-6 py-5 sm:px-10" role="group" aria-label="Ações">
          <Button variant="secondary" icon={hasResolvedContext ? 'panel-right-open' : 'link'} onClick={() => setShowContext(true)}>
            {hasResolvedContext ? 'Ver negócio' : 'Vincular negócio'}
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="ghost" icon="clock" onClick={onSnooze}>Adiar para amanhã</Button>
            <Button variant="ghost" iconRight="skip-forward" onClick={onSkip}>Pular</Button>
            <Button variant="primary" icon="check" onClick={onDone}>{doneLabel}</Button>
          </div>
        </div>
      </article>

      {/* Atalhos */}
      <p className="mt-4 hidden flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--text-tertiary)] md:flex">
        <span><Kbd>Enter</Kbd> {doneLabel.toLowerCase()}</span>
        <span><Kbd>A</Kbd> adiar</span>
        <span><Kbd>P</Kbd> pular</span>
        <span><Kbd>Espaço</Kbd> ver negócio</span>
        <span><Kbd>←</Kbd> <Kbd>→</Kbd> navegar</span>
      </p>

      {/* Cockpit Panel with AnimatePresence */}
      {createPortal(
        <AnimatePresence>
          {showContext && hasResolvedContext && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="fixed inset-0 md:left-[var(--app-sidebar-width,0px)] z-[9999] bg-black/50 backdrop-blur-sm"
            >
              <FocusContextPanel
                className="h-full w-full"
                isExpanded={showContext}
                deal={contextData.deal!}
                contact={contextData.contact}
                board={contextData.board ?? undefined}
                activities={contextData.activities}
                onMoveStage={handleMoveStage}
                onMarkWon={handleMarkWon}
                onMarkLost={handleMarkLost}
                onAddActivity={addActivity}
                onUpdateActivity={updateActivity}
                onClose={() => setShowContext(false)}
              />
            </motion.div>
          )}

          {showContext && !hasResolvedContext && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="fixed inset-0 md:left-[var(--app-sidebar-width,0px)] z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Vincular contexto"
            >
              <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 shadow-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Vincular contexto</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Esta atividade não tem deal/contato associado. Selecione um negócio para abrir o Cockpit.
                    </div>
                  </div>
                  <button
                    onClick={() => setShowContext(false)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    aria-label="Fechar"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-4">
                  <input
                    value={contextSearch}
                    onChange={e => setContextSearch(e.target.value)}
                    placeholder="Buscar negócio pelo título…"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-500/40"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-auto pr-1">
                  {suggestedDeals.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setManualDealId(d.id)}
                      className="text-left rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 px-3 py-2 transition-colors"
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{d.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{d.contactName}</div>
                    </button>
                  ))}
                  {suggestedDeals.length === 0 && (
                    <div className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center col-span-full">
                      Nenhum negócio encontrado. Tente outro termo.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
