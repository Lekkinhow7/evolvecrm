'use client'

import React, { useState } from 'react';
import { useActivitiesController } from './hooks/useActivitiesController';
import { ActivitiesHeader } from './components/ActivitiesHeader';
import { ActivitiesFilters } from './components/ActivitiesFilters';
import { ActivitiesList } from './components/ActivitiesList';
import { ActivitiesCalendar } from './components/ActivitiesCalendar';
import { ActivityFormModal } from './components/ActivityFormModal';
import { NovaReuniaoModal } from './components/NovaReuniaoModal';
import { ReuniaoDetalhe } from './components/ReuniaoDetalhe';
import { BulkActionsToolbar } from './components/BulkActionsToolbar';
import { useToast } from '@/context/ToastContext';
import type { Activity } from '@/types';

/**
 * Componente React `ActivitiesPage`.
 * @returns {Element} Retorna um valor do tipo `Element`.
 */
export interface ActivitiesPageProps {
    /** Abre direto no calendário (rota /agenda). */
    initialView?: 'list' | 'calendar';
    title?: string;
    subtitle?: string;
}

export const ActivitiesPage: React.FC<ActivitiesPageProps> = ({ initialView, title, subtitle }) => {
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
        isMeetingModalOpen,
        setIsMeetingModalOpen,
        editingActivity,
        formData,
        setFormData,
        filteredActivities,
        deals,
        contacts,
        companies,
        handleNewActivity,
        handleEditActivity,
        handleDeleteActivity,
        handleToggleComplete,
        handleSubmit
    } = useActivitiesController({ initialView });

    const { addToast } = useToast();
    const [reuniaoAberta, setReuniaoAberta] = useState<Activity | null>(null);
    const [reuniaoDealId, setReuniaoDealId] = useState<string | undefined>(undefined);

    // Reunião da agenda (com agendamento no n8n) abre o detalhe, não o formulário genérico.
    const abrirAtividade = (activity: Activity) => {
        if (activity.type === 'MEETING' && activity.externalRef) {
            setReuniaoAberta(activity);
            return;
        }
        handleEditActivity(activity);
    };

    // Tipo "Reunião" no formulário de atividade nova troca para a marcação pelos horários livres.
    const trocarParaNovaReuniao = (dealId?: string) => {
        setIsModalOpen(false);
        setReuniaoDealId(dealId);
        setIsMeetingModalOpen(true);
    };
    const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

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
        <div className="mx-auto max-w-400">
            <ActivitiesHeader
                viewMode={viewMode}
                setViewMode={setViewMode}
                onNewActivity={handleNewActivity}
                dateFilter={dateFilter}
                title={title}
                subtitle={subtitle}
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
                        onEdit={abrirAtividade}
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
                    onSelectMeeting={setReuniaoAberta}
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
                onEscolherReuniao={trocarParaNovaReuniao}
            />

            <NovaReuniaoModal
                open={isMeetingModalOpen}
                dealId={reuniaoDealId}
                onClose={() => {
                    setIsMeetingModalOpen(false);
                    setReuniaoDealId(undefined);
                }}
            />

            {reuniaoAberta && (
                <ReuniaoDetalhe
                    key={reuniaoAberta.id}
                    activity={reuniaoAberta}
                    onClose={() => setReuniaoAberta(null)}
                />
            )}

            <BulkActionsToolbar
                selectedCount={selectedActivities.size}
                onCompleteAll={handleCompleteAll}
                onSnoozeAll={handleSnoozeAll}
                onClearSelection={handleClearSelection}
            />
        </div>
    );
};
