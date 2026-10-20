import React, { useState } from 'react';
import { useCreateDealWithContact } from '@/lib/query/hooks/useDealsQuery';
import { useBoards } from '@/lib/query/hooks/useBoardsQuery';
import { useAuth } from '@/context/AuthContext';
import { Deal, Board, Contact, Company } from '@/types';
import { X, Building2, User, Mail, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { DebugFillButton } from '@/components/debug/DebugFillButton';
import { fakeDeal, fakeContact, fakeCompany } from '@/lib/debug';
import { ContactSearchCombobox } from '@/components/ui/ContactSearchCombobox';

import { Segmented } from '@/design-system';
import {
  FIELD_INPUT_CLASS,
  FIELD_LABEL_CLASS,
  MODAL_BODY_CLASS,
  MODAL_CLOSE_BUTTON_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_BASE_CLASS,
  MODAL_TITLE_CLASS,
} from '@/components/ui/modalStyles';
interface CreateDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** O board ativo - passado pelo controller do Kanban */
    activeBoard?: Board | null;
    /** O ID do board ativo - passado pelo controller do Kanban */
    activeBoardId?: string;
}

/**
 * Modal para criação de um novo negócio (Deal).
 * Permite buscar contatos existentes ou criar novos.
 */
export const CreateDealModal: React.FC<CreateDealModalProps> = ({
    isOpen,
    onClose,
    activeBoard: propActiveBoard,
    activeBoardId: propActiveBoardId
}) => {
    const createDealWithContact = useCreateDealWithContact();
    const { data: boards = [] } = useBoards();
    const { profile, user } = useAuth();

    // Prioriza props sobre contexto (permite que o Kanban passe o board correto)
    const activeBoard = propActiveBoard || boards[0] || null;
    const activeBoardId = propActiveBoardId || activeBoard?.id || '';

    // Estado para contato/empresa selecionados
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    
    // Estado para criação de novo contato
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newContactData, setNewContactData] = useState({
        name: '',
        email: '',
        phone: '',
        companyName: ''
    });

    // Estado do deal
    const [dealData, setDealData] = useState({
        title: '',
        value: ''
    });

    // Estado de UI
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setSelectedContact(null);
        setSelectedCompany(null);
        setIsCreatingNew(false);
        setNewContactData({ name: '', email: '', phone: '', companyName: '' });
        setDealData({ title: '', value: '' });
        setError(null);
        setIsSubmitting(false);
    };

    const fillWithFakeData = () => {
        const deal = fakeDeal();
        const contact = fakeContact();
        const company = fakeCompany();
        
        setDealData({
            title: deal.title,
            value: String(deal.value)
        });
        
        setIsCreatingNew(true);
        setNewContactData({
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            companyName: company.name
        });
    };

    const handleCreateNew = (searchTerm: string) => {
        setIsCreatingNew(true);
        // Se o termo parece ser email, telefone ou nome
        if (searchTerm.includes('@')) {
            setNewContactData(prev => ({ ...prev, email: searchTerm }));
        } else if (/^\d+$/.test(searchTerm.replace(/\D/g, '')) && searchTerm.length >= 8) {
            setNewContactData(prev => ({ ...prev, phone: searchTerm }));
        } else {
            setNewContactData(prev => ({ ...prev, name: searchTerm }));
        }
    };

    if (!isOpen) return null;

    // Guard: não permite criar deal sem board ativo
    if (!activeBoard || !activeBoard.stages?.length) {
        return (
            <div className={MODAL_OVERLAY_CLASS}>
                <div className={`${MODAL_PANEL_BASE_CLASS} max-w-md p-5`}>
                    <p className="text-[var(--text-secondary)] text-center">
                        Nenhum board selecionado ou board sem estágios.
                    </p>
                    <button
                        onClick={onClose}
                        className="at-btn at-btn--secondary at-btn--md at-btn--block mt-4"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        );
    }

    const handleCreateDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            // Usa o primeiro estágio do board ativo
            const firstStage = activeBoard.stages[0];

            const ownerName = profile?.nickname ||
                profile?.first_name ||
                (profile?.email || user?.email || '').split('@')[0] ||
                'Eu';

            const deal: Deal = {
                id: crypto.randomUUID(),
                title: dealData.title,
                companyId: selectedCompany?.id || '',
                contactId: selectedContact?.id || '',
                boardId: activeBoardId || activeBoard.id,
                ownerId: user?.id || '',
                value: Number(dealData.value) || 0,
                items: [],
                status: firstStage.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                probability: 10,
                priority: 'medium',
                tags: ['Novo'],
                owner: {
                    name: ownerName,
                    avatar: profile?.avatar_url || ''
                },
                customFields: {},
                isWon: false,
                isLost: false,
            };

            const { id: _id, createdAt: _createdAt, ...dealWithoutId } = deal;

            // Se selecionou contato existente
            if (selectedContact) {
                await createDealWithContact.mutateAsync({
                    deal: dealWithoutId,
                    relatedData: {
                        companyName: selectedCompany?.name || '',
                        contact: {
                            name: selectedContact.name,
                            email: selectedContact.email,
                            phone: selectedContact.phone
                        }
                    }
                });
            } else {
                // Criando novo contato
                await createDealWithContact.mutateAsync({
                    deal: dealWithoutId,
                    relatedData: {
                        companyName: newContactData.companyName,
                        contact: {
                            name: newContactData.name,
                            email: newContactData.email,
                            phone: newContactData.phone
                        }
                    }
                });
            }

            onClose();
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar negócio. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasContact = selectedContact || (isCreatingNew && newContactData.name);

    return (
        <div
            className={MODAL_OVERLAY_CLASS}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={`${MODAL_PANEL_BASE_CLASS} max-w-md animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`${MODAL_HEADER_CLASS} sticky top-0 bg-[var(--surface-card)] z-10`}>
                    <div className="flex items-center gap-2">
                        <h2 className={MODAL_TITLE_CLASS}>Novo negócio</h2>
                        <DebugFillButton onClick={fillWithFakeData} />
                    </div>
                    <button onClick={() => { onClose(); resetForm(); }} className={MODAL_CLOSE_BUTTON_CLASS} aria-label="Fechar">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleCreateDeal} className={`${MODAL_BODY_CLASS} space-y-5`}>
                    {/* Contato - Tabs para escolher modo */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                                Contato
                            </span>
                            {!selectedContact && (
                                <Segmented
                                    className="ml-auto"
                                    size="sm"
                                    variant="text"
                                    value={isCreatingNew ? 'novo' : 'buscar'}
                                    onChange={(v) => setIsCreatingNew(v === 'novo')}
                                    options={[{ value: 'buscar', label: 'Buscar' }, { value: 'novo', label: 'Cadastrar novo' }]}
                                />
                            )}
                        </div>
                        
                        {/* Modo: Contato Selecionado */}
                        {selectedContact ? (
                            <div className="relative">
                                <div className="flex items-center gap-3 p-3 bg-[var(--surface-accent)] border border-[var(--border-accent)] rounded-[var(--radius-lg)]">
                                    <div className="w-10 h-10 bg-[var(--surface-card)] rounded-full flex items-center justify-center">
                                        <User size={20} className="text-[var(--text-accent)]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 dark:text-white truncate">
                                            {selectedContact.name}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                            {selectedContact.email && (
                                                <span className="flex items-center gap-1 truncate">
                                                    <Mail size={12} />
                                                    {selectedContact.email}
                                                </span>
                                            )}
                                            {selectedContact.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={12} />
                                                    {selectedContact.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedContact(null);
                                            setSelectedCompany(null);
                                        }}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                
                                {selectedCompany && (
                                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-sm">
                                        <Building2 size={14} className="text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-300">{selectedCompany.name}</span>
                                    </div>
                                )}
                            </div>
                        ) : !isCreatingNew ? (
                            /* Modo: Buscar Existente */
                            <ContactSearchCombobox
                                selectedContact={selectedContact}
                                selectedCompany={selectedCompany}
                                onSelectContact={setSelectedContact}
                                onSelectCompany={setSelectedCompany}
                                onCreateNew={handleCreateNew}
                            />
                        ) : (
                            /* Modo: Criar Novo */
                            <div className="space-y-3">
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Nome do contato *"
                                        required={isCreatingNew}
                                        value={newContactData.name}
                                        onChange={(e) => setNewContactData(prev => ({ ...prev, name: e.target.value }))}
                                        className={`${FIELD_INPUT_CLASS} pl-10`}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            placeholder="E-mail"
                                            value={newContactData.email}
                                            onChange={(e) => setNewContactData(prev => ({ ...prev, email: e.target.value }))}
                                            className={`${FIELD_INPUT_CLASS} pl-10`}
                                        />
                                    </div>
                                    
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="tel"
                                            placeholder="Telefone"
                                            value={newContactData.phone}
                                            onChange={(e) => setNewContactData(prev => ({ ...prev, phone: e.target.value }))}
                                            className={`${FIELD_INPUT_CLASS} pl-10`}
                                        />
                                    </div>
                                </div>
                                
                                <div className="relative">
                                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Empresa (opcional)"
                                        value={newContactData.companyName}
                                        onChange={(e) => setNewContactData(prev => ({ ...prev, companyName: e.target.value }))}
                                        className={`${FIELD_INPUT_CLASS} pl-10`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dados do Negócio */}
                    <div className="pt-4 border-t border-[var(--border-hairline)]">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Sobre o caso</h3>
                        
                        <div className="space-y-3">
                            <div>
                                <label className={FIELD_LABEL_CLASS}>Assunto *</label>
                                <input
                                    required
                                    type="text"
                                    className={FIELD_INPUT_CLASS}
                                    placeholder="Ex.: Fraude bancária"
                                    value={dealData.title}
                                    onChange={e => setDealData(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>
                            
                            <div>
                                <label className={FIELD_LABEL_CLASS}>Honorários previstos (R$)</label>
                                <input
                                    type="number"
                                    className={FIELD_INPUT_CLASS}
                                    placeholder="Opcional"
                                    value={dealData.value}
                                    onChange={e => setDealData(prev => ({ ...prev, value: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mensagem de erro */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] rounded-[var(--radius-lg)] text-sm text-[var(--status-danger-fg)]">
                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={!hasContact || !dealData.title || isSubmitting}
                        className="at-btn at-btn--primary at-btn--md at-btn--block mt-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Criando...
                            </>
                        ) : (
                            'Criar negócio'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
