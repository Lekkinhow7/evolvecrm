import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import { ActivitiesPage } from '@/features/activities/ActivitiesPage'

export const metadata: Metadata = { title: `Atividades | ${CRM_NAME}` };

export default function Activities() {
    return <ActivitiesPage />
}
