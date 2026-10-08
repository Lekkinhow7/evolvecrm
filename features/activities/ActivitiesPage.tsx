'use client'

import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActivitiesController } from './hooks/useActivitiesController';
import { VisitModal } from './components/VisitModal';
import { CallModal } from './components/CallModal';
import { queryKeys } from '@/lib/query/queryKeys';
import type { Activity } from '@/types';
import { ActivitiesHeader } from './components/ActivitiesHeader';
import { ActivitiesFilters } from './components/ActivitiesFilters';
import { ActivitiesList } from './components/ActivitiesList';
import { ActivitiesCalendar } from './components/ActivitiesCalendar';
import { ActivityFormModal } from './components/ActivityFormModal';
import { BulkActionsToolbar } from './components/BulkActionsToolbar';
import { useToast } from '@/context/ToastContext';

/**
 * Componente React `ActivitiesPage`.
 * @returns {Element} Retorna um valor do tipo `Element`.
 */
export const ActivitiesPage: React.FC = () => {
    const {
        viewMode,
        setViewMode,
        searchTerm,
        setSearchTerm,
        filterType,
        setFilterType,
        dateFilter,
        currentDate,
        setCurrentDate,
        isModalOpen,
        setIsModalOpen,
        editingActivity,
        formData,
        setFormData,
        filteredActivities,
        activities,
        deals,
        contacts,
        companies,
        handleNewActivity,
        handleEditActivity,
        handleDeleteActivity,
        handleToggleComplete,
        handleSubmit
    } = useActivitiesController();

    const { addToast } = useToast();
    const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
    // Visita técnica abre em detalhe próprio: tem situação, técnico e formulário.
    const [visitaAberta, setVisitaAberta] = useState<Activity | null>(null);
    // Call do vendedor abre na ficha da call: anotações, resultado e agendamento da visita.
    const [callAberta, setCallAberta] = useState<Activity | null>(null);
    const abrirAtividade = (a: Activity) => {
        if (a.type === 'MEETING') setCallAberta(a);
        else if (a.type === 'VISITA') setVisitaAberta(a);
    };
    const handleEditOuAbrir = (a: Activity) => {
        if (a.type === 'MEETING') setCallAberta(a);
        else handleEditActivity(a);
    };

    // O link do aviso no WhatsApp chega com ?atividade=<id>: abre a ficha direto.
    const linkAberto = useRef(false);
    useEffect(() => {
        if (linkAberto.current || !activities.length) return;
        const id = new URLSearchParams(window.location.search).get('atividade');
        if (!id) return;
        const alvo = activities.find((a) => a.id === id);
        if (!alvo) return;
        linkAberto.current = true;
        abrirAtividade(alvo);
    }, [activities]);

    const queryClient = useQueryClient();
    const refetchActivities = () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    };

    const handleSelectActivity = (id: string, selected: boolean) => {
        setSelectedActivities(prev => {
            const newSet = new Set(prev);
            if (selected) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    };

    const handleClearSelection = () => {
        setSelectedActivities(new Set());
    };

    const handleCompleteAll = () => {
        selectedActivities.forEach(id => {
            handleToggleComplete(id);
        });
        addToast(`${selectedActivities.size} atividades concluídas!`, 'success');
        handleClearSelection();
    };

    const handleSnoozeAll = () => {
        // In a real app, this would update the date of each activity
        addToast(`${selectedActivities.size} atividades adiadas para amanhã!`, 'success');
        handleClearSelection();
    };

    return (
        <div className="p-8 max-w-400 mx-auto">
            <ActivitiesHeader
                viewMode={viewMode}
                setViewMode={setViewMode}
                onNewActivity={handleNewActivity}
                dateFilter={dateFilter}
            />

            {viewMode === 'list' ? (
                <>
                    <ActivitiesFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterType={filterType}
                        setFilterType={setFilterType}
                    />
                    <ActivitiesList
                        activities={filteredActivities}
                        deals={deals}
                        contacts={contacts}
                        companies={companies}
                        onToggleComplete={handleToggleComplete}
                        onEdit={handleEditOuAbrir}
                        onDelete={handleDeleteActivity}
                        selectedActivities={selectedActivities}
                        onSelectActivity={handleSelectActivity}
                        onAddActivity={handleNewActivity}
                    />
                </>
            ) : (
                <ActivitiesCalendar
                    activities={filteredActivities}
                    deals={deals}
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    onSelectVisit={abrirAtividade}
                />
            )}

            {callAberta && (
                <CallModal
                    call={callAberta}
                    visitaAgendada={activities.find((a) => a.originActivityId === callAberta.id) || null}
                    onAbrirVisita={(v) => {
                        setCallAberta(null);
                        setVisitaAberta(v);
                    }}
                    onClose={() => {
                        setCallAberta(null);
                        refetchActivities();
                    }}
                    onSalvo={() => {
                        setCallAberta(null);
                        refetchActivities();
                    }}
                />
            )}

            {visitaAberta && (
                <VisitModal
                    visita={visitaAberta}
                    onClose={() => setVisitaAberta(null)}
                    onSalvo={() => {
                        setVisitaAberta(null);
                        refetchActivities();
                    }}
                />
            )}

            <ActivityFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                editingActivity={editingActivity}
                deals={deals}
            />

            <BulkActionsToolbar
                selectedCount={selectedActivities.size}
                onCompleteAll={handleCompleteAll}
                onSnoozeAll={handleSnoozeAll}
                onClearSelection={handleClearSelection}
            />
        </div>
    );
};
