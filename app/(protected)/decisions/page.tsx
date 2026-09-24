import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import { DecisionQueuePage } from '@/features/decisions/DecisionQueuePage'

export const metadata: Metadata = { title: `Decisões | ${CRM_NAME}` };

export default function Decisions() {
    return <DecisionQueuePage />
}
