import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNewParam } from '@/hooks/useNewParam';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Activity } from '@/types';
import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
} from '@/lib/query/hooks/useActivitiesQuery';
import { useDeals } from '@/lib/query/hooks/useDealsQuery';
import { useContacts, useCompanies } from '@/lib/query/hooks/useContactsQuery';
import { useRealtimeSync } from '@/lib/realtime/useRealtimeSync';
import { toLocalDateInput } from '@/lib/utils/localDate';
import { isRecordActivity } from '@/components/navigation/sidebarStats';
import { officeDayBounds } from '@/lib/utils/brTime';

/** Tipos aceitos no `?tipo=` da URL (os mesmos do filtro de tipo da tela). */
const URL_TYPES: Activity['type'][] = ['CALL', 'MEETING', 'EMAIL', 'TASK'];

/**
 * Hook React `useActivitiesController` que encapsula uma lógica reutilizável.
 * @returns {{ viewMode: "list" | "calendar"; setViewMode: Dispatch<SetStateAction<"list" | "calendar">>; searchTerm: string; setSearchTerm: Dispatch<SetStateAction<string>>; ... 18 more ...; handleSubmit: (e: FormEvent<...>) => void; }} Retorna um valor do tipo `{ viewMode: "list" | "calendar"; setViewMode: Dispatch<SetStateAction<"list" | "calendar">>; searchTerm: string; setSearchTerm: Dispatch<SetStateAction<string>>; ... 18 more ...; handleSubmit: (e: FormEvent<...>) => void; }`.
 */
export const useActivitiesController = (options?: { initialView?: 'list' | 'calendar' }) => {
  const searchParams = useSearchParams();

  // Auth for tenant organization_id
  const { profile, organizationId } = useAuth();

  // TanStack Query hooks
  const { data: activities = [], isLoading: activitiesLoading } = useActivities();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const createActivityMutation = useCreateActivity();
  const updateActivityMutation = useUpdateActivity();
  const deleteActivityMutation = useDeleteActivity();

  // Enable realtime sync
  useRealtimeSync('activities');

  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(options?.initialView ?? 'list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Activity['type'] | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'overdue' | 'today' | 'upcoming'>('ALL');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  // Permite deep-link do Inbox: /activities?filter=overdue|today|upcoming (e do menu: &tipo=TASK).
  // Depende só desses parâmetros: tirar o `novo` da URL não apaga o filtro escolhido.
  const filterParam = (searchParams.get('filter') || '').toLowerCase();
  const typeParam = searchParams.get('tipo') || '';
  const viewParam = searchParams.get('view');
  useEffect(() => {
    const filter = filterParam;
    setFilterType(URL_TYPES.includes(typeParam as Activity['type']) ? (typeParam as Activity['type']) : 'ALL');

    if (filter === 'overdue' || filter === 'today' || filter === 'upcoming') {
      setDateFilter(filter);
      setViewMode('list');
      return;
    }

    // Qualquer outro valor (inclui vazio) cai no padrão.
    setDateFilter('ALL');
    // /activities?view=calendar abre direto no calendário (botão "Abrir agenda" do menu lateral).
    if (viewParam === 'calendar') setViewMode('calendar');
  }, [filterParam, typeParam, viewParam]);

  const [formData, setFormData] = useState({
    title: '',
    type: 'CALL' as Activity['type'],
    date: toLocalDateInput(),
    time: '09:00',
    description: '',
    dealId: '',
  });

  const isLoading = activitiesLoading || dealsLoading || contactsLoading || companiesLoading;

  // Performance: build lookups once (avoid `.find(...)` in handlers).
  const activitiesById = useMemo(() => new Map(activities.map((a) => [a.id, a])), [activities]);
  const dealsById = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals]);
  const contactsById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);

  // Performance: compute date boundaries once per render (used inside memoized filters).
  // "Hoje" no horário de Brasília (mesma regra do menu lateral).
  const dateBoundaries = useMemo(() => officeDayBounds(), []);

  const filteredActivities = useMemo(() => {
    const { todayTs, tomorrowTs } = dateBoundaries;
    const q = searchTerm.toLowerCase();

    return activities
      .map((activity) => ({ activity, ts: Date.parse(activity.date) }))
      .filter(({ activity, ts }) => {
        const matchesSearch = (activity.title || '').toLowerCase().includes(q);
        // 'Todos' mostra o que é para fazer; notas e registros automáticos só aparecem filtrando pelo tipo.
        const matchesType = filterType === 'ALL' ? !isRecordActivity(activity) : activity.type === filterType;
        const isPending = !activity.completed;

        const matchesDateFilter =
          dateFilter === 'ALL'
            ? true
            : dateFilter === 'overdue'
              ? isPending && ts < todayTs
              : dateFilter === 'today'
                ? isPending && ts >= todayTs && ts < tomorrowTs
                : isPending && ts >= tomorrowTs;

        return matchesSearch && matchesType && matchesDateFilter;
      })
      // Performance: sort by numeric timestamp (avoid `new Date(...)` in comparator).
      .sort((a, b) => a.ts - b.ts)
      .map(({ activity }) => activity);
  }, [activities, dateBoundaries, searchTerm, filterType, dateFilter]);

  const handleNewActivity = () => {
    setEditingActivity(null);
    setFormData({
      title: '',
      type: 'CALL',
      date: toLocalDateInput(),
      time: '09:00',
      description: '',
      dealId: '',
    });
    setIsModalOpen(true);
  };

  // Botão Novo do menu lateral: /activities?novo=reuniao abre uma reunião; ?novo=tarefa, uma tarefa.
  useNewParam((value) => {
    // Reunião nova é marcada em horário livre da agenda (modal próprio), não pelo formulário de atividade.
    if (value === 'reuniao') {
      setIsMeetingModalOpen(true);
      return;
    }
    handleNewActivity();
    if (value === 'tarefa') setFormData((f) => ({ ...f, type: 'TASK' }));
  });

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    const date = new Date(activity.date);
    setFormData({
      title: activity.title,
      type: activity.type,
      date: toLocalDateInput(date),
      time: date.toTimeString().slice(0, 5),
      description: activity.description || '',
      dealId: activity.dealId,
    });
    setIsModalOpen(true);
  };

  const handleDeleteActivity = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta atividade?')) {
      deleteActivityMutation.mutate(id, {
        onSuccess: () => {
          showToast('Atividade excluída com sucesso', 'success');
        },
      });
    }
  };

  const handleToggleComplete = useCallback(
    (id: string) => {
      const activity = activitiesById.get(id);
      if (!activity) return;

      updateActivityMutation.mutate(
        {
          id,
          updates: { completed: !activity.completed },
        },
        {
          onSuccess: () => {
            showToast(activity.completed ? 'Atividade reaberta' : 'Atividade concluída', 'success');
          },
        }
      );
    },
    [activitiesById, showToast, updateActivityMutation]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const date = new Date(`${formData.date}T${formData.time}`);
    const selectedDeal = formData.dealId ? dealsById.get(formData.dealId) : undefined;
    const selectedContact = selectedDeal?.contactId ? contactsById.get(selectedDeal.contactId) : undefined;
    const clientCompanyId = selectedDeal?.clientCompanyId || selectedContact?.clientCompanyId || undefined;
    const participantContactIds = selectedContact?.id ? [selectedContact.id] : [];

    if (editingActivity) {
      updateActivityMutation.mutate(
        {
          id: editingActivity.id,
          updates: {
            title: formData.title,
            type: formData.type,
            description: formData.description,
            date: date.toISOString(),
            dealId: formData.dealId || '',
            contactId: selectedContact?.id || '',
            clientCompanyId,
            participantContactIds,
          },
        },
        {
          onSuccess: () => {
            showToast('Atividade atualizada com sucesso', 'success');
            setIsModalOpen(false);
          },
        }
      );
    } else {
      createActivityMutation.mutate(
        {
          activity: {
            title: formData.title,
            type: formData.type,
            description: formData.description,
            date: date.toISOString(),
            dealId: formData.dealId || '',
            contactId: selectedContact?.id || '',
            clientCompanyId,
            participantContactIds,
            dealTitle: selectedDeal?.title || '',
            completed: false,
            user: { name: 'Eu', avatar: '' },
          },
        },
        {
          onSuccess: () => {
            showToast('Atividade criada com sucesso', 'success');
            setIsModalOpen(false);
          },
          onError: (error: Error) => {
            showToast(`Erro ao criar atividade: ${error.message}`, 'error');
          },
        }
      );
    }
  };

  return {
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    dateFilter,
    setDateFilter,
    currentDate,
    setCurrentDate,
    isModalOpen,
    setIsModalOpen,
    editingActivity,
    formData,
    setFormData,
    filteredActivities,
    deals,
    contacts,
    companies,
    isLoading,
    isMeetingModalOpen,
    setIsMeetingModalOpen,
    handleNewActivity,
    handleEditActivity,
    handleDeleteActivity,
    handleToggleComplete,
    handleSubmit,
  };
};
