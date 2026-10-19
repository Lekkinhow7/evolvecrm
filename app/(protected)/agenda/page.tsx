import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import { ActivitiesPage } from '@/features/activities/ActivitiesPage'

export const metadata: Metadata = { title: `Agenda | ${CRM_NAME}` };

/** Agenda: as reuniões e compromissos das Tarefas no calendário. */
export default function Agenda() {
    return <ActivitiesPage initialView="calendar" title="Agenda" subtitle="Reuniões e compromissos no calendário." />
}
