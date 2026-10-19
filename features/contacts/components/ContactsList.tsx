import React from 'react';
import { Building2, Mail, Phone, Plus, Pencil, Trash2, Globe, ArrowUpDown, ArrowUp, ArrowDown, Users } from 'lucide-react';
import { Badge } from '@/design-system';
import { Contact, Company, ContactSortableColumn } from '@/types';
import { StageBadge } from './ContactsStageTabs';
import { EmptyState } from '@/components/ui/EmptyState';

// Performance: reuse Intl formatters (they are relatively expensive to instantiate).
const PT_BR_DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR');
const PT_BR_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

/**
 * Formata uma data para exibição relativa (ex: "Hoje", "Ontem", "Há 3 dias", "15/11/2024")
 */
function formatRelativeDate(dateString: string | undefined | null, now: Date): string {
    if (!dateString) return '—';
    
    const date = new Date(dateString);
    
    // Reset hours for accurate day comparison
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = today.getTime() - dateDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} sem.`;
    
    // For older dates, show the actual date
    return PT_BR_DATE_FORMATTER.format(date);
}

/** Props for sortable column header */
interface SortableHeaderProps {
    label: string;
    column: ContactSortableColumn;
    currentSort: ContactSortableColumn;
    sortOrder: 'asc' | 'desc';
    onSort: (column: ContactSortableColumn) => void;
}

/** Sortable column header component */
const SortableHeader: React.FC<SortableHeaderProps> = ({ label, column, currentSort, sortOrder, onSort }) => {
    const isActive = currentSort === column;
    
    return (
        <th scope="col" className="px-5 py-3">
            <button
                onClick={() => onSort(column)}
                className="group flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
                aria-label={`Ordenar por ${label}`}
            >
                {label}
                <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                    {isActive ? (
                        sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                        <ArrowUpDown size={14} />
                    )}
                </span>
            </button>
        </th>
    );
};

interface ContactsListProps {
    viewMode: 'people' | 'companies';
    filteredContacts: Contact[];
    filteredCompanies: Company[];
    contacts: Contact[]; // Needed for company view avatar grouping
    selectedIds: Set<string>;
    toggleSelect: (id: string) => void;
    toggleSelectAll: () => void;
    getCompanyName: (id: string | undefined | null) => string;
    updateContact: (id: string, data: Partial<Contact>) => void;
    convertContactToDeal: (id: string) => void;
    openEditModal: (contact: Contact) => void;
    setDeleteId: (id: string) => void;
    openEditCompanyModal?: (company: Company) => void;
    setDeleteCompanyId?: (id: string) => void;
    // Sorting props
    sortBy?: ContactSortableColumn;
    sortOrder?: 'asc' | 'desc';
    onSort?: (column: ContactSortableColumn) => void;
    // Duplicate detection
    duplicateContactIds?: Set<string>;
    // Empty state action
    onAddContact?: () => void;
}

/**
 * Componente React `ContactsList`.
 *
 * @param {ContactsListProps} {
    viewMode,
    filteredContacts,
    filteredCompanies,
    contacts,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    getCompanyName,
    updateContact,
    convertContactToDeal,
    openEditModal,
    setDeleteId,
    sortBy = 'created_at',
    sortOrder = 'desc',
    onSort,
} - Parâmetro `{
    viewMode,
    filteredContacts,
    filteredCompanies,
    contacts,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    getCompanyName,
    updateContact,
    convertContactToDeal,
    openEditModal,
    setDeleteId,
    sortBy = 'created_at',
    sortOrder = 'desc',
    onSort,
}`.
 * @returns {Element} Retorna um valor do tipo `Element`.
 */
export const ContactsList: React.FC<ContactsListProps> = ({
    viewMode,
    filteredContacts,
    filteredCompanies,
    contacts,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    getCompanyName,
    updateContact,
    convertContactToDeal,
    openEditModal,
    setDeleteId,
    openEditCompanyModal,
    setDeleteCompanyId,
    sortBy = 'created_at',
    sortOrder = 'desc',
    onSort,
    duplicateContactIds,
    onAddContact,
}) => {
    const activeListIds = viewMode === 'people'
        ? filteredContacts.map(c => c.id)
        : filteredCompanies.map(c => c.id);
    const allSelected = activeListIds.length > 0 && selectedIds.size === activeListIds.length;

    const someSelected = selectedIds.size > 0 && selectedIds.size < activeListIds.length;

    // Performance: compute "contacts by company" once (avoids N filters per company row).
    const contactsByCompanyId = React.useMemo(() => {
        const map = new Map<string, Contact[]>();
        for (const c of contacts) {
            const companyId = c.clientCompanyId;
            if (!companyId) continue;
            const list = map.get(companyId);
            if (list) list.push(c);
            else map.set(companyId, [c]);
        }
        return map;
    }, [contacts]);

    // Performance: avoid creating `new Date()` for each row in formatRelativeDate.
    // Memoized para evitar hydration mismatch (server vs client timestamp) e
    // evitar recriação a cada render
    const now = React.useMemo(() => new Date(), []);
    
    return (
        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-hairline)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]">
            <div className="overflow-x-auto">
                {viewMode === 'people' ? (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-[var(--border-hairline)] bg-[var(--surface-sunken)]">
                            <tr>
                                <th scope="col" className="w-12 px-5 py-3">
                                    <input 
                                        type="checkbox" 
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                        onChange={toggleSelectAll}
                                        aria-label={allSelected ? 'Desmarcar todos os contatos' : 'Selecionar todos os contatos'}
                                        className="size-4 rounded accent-[var(--action-primary-bg)]" 
                                    />
                                </th>
                                {onSort ? (
                                    <SortableHeader label="Nome" column="name" currentSort={sortBy} sortOrder={sortOrder} onSort={onSort} />
                                ) : (
                                    <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Nome</th>
                                )}
                                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Estágio</th>
                                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Cargo / Empresa</th>
                                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Contato</th>
                                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Status</th>
                                {onSort ? (
                                    <SortableHeader label="Criado" column="created_at" currentSort={sortBy} sortOrder={sortOrder} onSort={onSort} />
                                ) : (
                                    <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Criado</th>
                                )}
                                {onSort ? (
                                    <SortableHeader label="Modificado" column="updated_at" currentSort={sortBy} sortOrder={sortOrder} onSort={onSort} />
                                ) : (
                                    <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Modificado</th>
                                )}
                                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-hairline)]">
                            {filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={9}>
                                        <EmptyState
                                            icon={Users}
                                            title="Nenhum contato encontrado"
                                            description="Tente ajustar os filtros ou adicione um novo contato."
                                            action={onAddContact ? { label: 'Adicionar contato', onClick: onAddContact } : undefined}
                                        />
                                    </td>
                                </tr>
                            ) : filteredContacts.map((contact) => (
                                <tr key={contact.id} className={`group transition-colors hover:bg-[var(--surface-hover)] ${selectedIds.has(contact.id) ? 'bg-[var(--surface-accent)]' : ''}`}>
                                    <td className="px-5 py-3">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(contact.id)}
                                            onChange={() => toggleSelect(contact.id)}
                                            aria-label={`Selecionar ${contact.name}`}
                                            className="size-4 rounded accent-[var(--action-primary-bg)]" 
                                        />
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(contact)}
                                                className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--surface-muted)] text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                                                aria-label={`Editar contato: ${contact.name || 'Sem nome'}`}
                                                title={contact.name || 'Sem nome'}
                                            >
                                                {(contact.name || '?').charAt(0)}
                                            </button>
                                            <div>
                                                <span className="block font-medium text-[var(--text-primary)]">
                                                    {contact.name}
                                                    {duplicateContactIds?.has(contact.id) && (
                                                        <Badge tone="warning" className="ml-2 align-middle">Duplicado</Badge>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <StageBadge stage={contact.stage} />
                                    </td>
                                    <td className="px-5 py-3">
                                        {contact.role || contact.clientCompanyId ? (
                                            <div>
                                                {contact.role ? <span className="block text-[var(--text-primary)]">{contact.role}</span> : null}
                                                {contact.clientCompanyId ? (
                                                    <span className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                                                        <Building2 size={12} aria-hidden="true" />
                                                        {getCompanyName(contact.clientCompanyId)}
                                                    </span>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <span className="text-[var(--text-quiet)]">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
                                            {contact.phone ? (
                                                <span className="flex items-center gap-2 tabular-nums"><Phone size={12} aria-hidden="true" /> {contact.phone}</span>
                                            ) : null}
                                            {contact.email ? (
                                                <span className="flex items-center gap-2"><Mail size={12} aria-hidden="true" /> {contact.email}</span>
                                            ) : null}
                                            {!contact.phone && !contact.email ? <span className="text-[var(--text-quiet)]">—</span> : null}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const nextStatus = contact.status === 'ACTIVE' ? 'INACTIVE' : contact.status === 'INACTIVE' ? 'CHURNED' : 'ACTIVE';
                                                    updateContact(contact.id, { status: nextStatus });
                                                }}
                                                aria-label={`Alterar status de ${contact.name} de ${contact.status === 'ACTIVE' ? 'ativo' : contact.status === 'INACTIVE' ? 'inativo' : 'perdido'}`}
                                                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                                                title="Clique para trocar o status"
                                            >
                                                <Badge tone={contact.status === 'ACTIVE' ? 'success' : contact.status === 'INACTIVE' ? 'warning' : 'danger'}>
                                                    {contact.status === 'ACTIVE' ? 'Ativo' : contact.status === 'INACTIVE' ? 'Inativo' : 'Cancelado'}
                                                </Badge>
                                            </button>
                                            <button
                                                onClick={() => convertContactToDeal(contact.id)}
                                                className="rounded-md p-1 text-[var(--text-quiet)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                                                aria-label={`Criar negócio para ${contact.name}`}
                                                title="Criar negócio"
                                            >
                                                <Plus size={14} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div
                                            className="text-xs text-[var(--text-secondary)] tabular-nums"
                                            title={contact.createdAt ? PT_BR_DATE_TIME_FORMATTER.format(new Date(contact.createdAt)) : undefined}
                                        >
                                                                                        <span>{formatRelativeDate(contact.createdAt, now)}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div
                                            className="text-xs text-[var(--text-secondary)] tabular-nums"
                                            title={contact.updatedAt ? PT_BR_DATE_TIME_FORMATTER.format(new Date(contact.updatedAt)) : undefined}
                                        >
                                                                                        <span>{formatRelativeDate(contact.updatedAt, now)}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                                            <button
                                                onClick={() => openEditModal(contact)}
                                                className="rounded-md p-1.5 text-[var(--text-quiet)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                                                aria-label={`Editar ${contact.name}`}
                                            >
                                                <Pencil size={16} aria-hidden="true" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(contact.id)}
                                                className="rounded-md p-1.5 text-[var(--text-quiet)] transition-colors hover:bg-[var(--status-danger-bg)] hover:text-[var(--status-danger-fg)]"
                                                aria-label={`Excluir ${contact.name}`}
                                            >
                                                <Trash2 size={16} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-[var(--border-hairline)] bg-[var(--surface-sunken)]">
                            <tr>
                                <th scope="col" className="w-12 px-5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                        onChange={toggleSelectAll}
                                        aria-label={allSelected ? 'Desmarcar todas as empresas' : 'Selecionar todas as empresas'}
                                        className="size-4 rounded accent-[var(--action-primary-bg)]"
                                    />
                                </th>
                                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Empresa</th>
                                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Setor</th>
                                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Criado em</th>
                                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Pessoas</th>
                                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-hairline)]">
                            {filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState
                                            icon={Users}
                                            title="Nenhuma empresa encontrada"
                                            description="Tente ajustar os filtros ou adicione uma nova empresa."
                                        />
                                    </td>
                                </tr>
                            ) : filteredCompanies.map((company) => (
                                <tr key={company.id} className={`group transition-colors hover:bg-[var(--surface-hover)] ${selectedIds.has(company.id) ? 'bg-[var(--surface-accent)]' : ''}`}>
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(company.id)}
                                            onChange={() => toggleSelect(company.id)}
                                            aria-label={`Selecionar ${company.name}`}
                                            className="size-4 rounded accent-[var(--action-primary-bg)]"
                                        />
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            {(() => {
                                                const firstLinkedContact = (contactsByCompanyId.get(company.id) ?? [])[0];
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (firstLinkedContact) openEditModal(firstLinkedContact);
                                                        }}
                                                        disabled={!firstLinkedContact}
                                                        className={`grid size-9 place-items-center rounded-lg bg-[var(--surface-muted)] text-[var(--text-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                                                            firstLinkedContact ? 'hover:bg-[var(--surface-hover)]' : 'cursor-not-allowed opacity-50'
                                                        }`}
                                                        aria-label={
                                                            firstLinkedContact
                                                                ? `Abrir contato vinculado de ${company.name}`
                                                                : `Sem contatos vinculados para ${company.name}`
                                                        }
                                                        title={
                                                            firstLinkedContact
                                                                ? `Abrir: ${firstLinkedContact.name || 'Contato'}`
                                                                : 'Sem contatos vinculados'
                                                        }
                                                    >
                                                        <Building2 size={18} />
                                                    </button>
                                                );
                                            })()}
                                            <div>
                                                <span className="block font-medium text-[var(--text-primary)]">{company.name}</span>
                                                {company.website && (
                                                    <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[var(--text-link)] hover:underline">
                                                        <Globe size={10} /> {company.website}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        {company.industry ? <Badge tone="neutral">{company.industry}</Badge> : <span className="text-[var(--text-quiet)]">—</span>}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                                            {PT_BR_DATE_FORMATTER.format(new Date(company.createdAt))}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        {/*
                                          Performance: this row used to call `contacts.filter(...)` twice per company.
                                          We pre-index contactsByCompanyId above to make this O(C + P) instead of O(C * P).
                                        */}
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {(contactsByCompanyId.get(company.id) ?? []).map(c => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => openEditModal(c)}
                                                    className="grid size-7 place-items-center rounded-full bg-[var(--surface-muted)] text-xs font-semibold text-[var(--text-secondary)] ring-2 ring-[var(--surface-card)] transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-[var(--focus-ring)]"
                                                    title={c.name || 'Sem nome'}
                                                    aria-label={`Editar contato: ${c.name || 'Sem nome'}`}
                                                >
                                                    {(c.name || '?').charAt(0)}
                                                </button>
                                            ))}
                                            {(contactsByCompanyId.get(company.id) ?? []).length === 0 && (
                                                <span className="text-xs text-[var(--text-quiet)]">Ninguém ainda</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                                            <button
                                                onClick={() => openEditCompanyModal?.(company)}
                                                className="rounded-md p-1.5 text-[var(--text-quiet)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                                                aria-label={`Editar ${company.name}`}
                                            >
                                                <Pencil size={16} aria-hidden="true" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteCompanyId?.(company.id)}
                                                className="rounded-md p-1.5 text-[var(--text-quiet)] transition-colors hover:bg-[var(--status-danger-bg)] hover:text-[var(--status-danger-fg)]"
                                                aria-label={`Excluir ${company.name}`}
                                            >
                                                <Trash2 size={16} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
