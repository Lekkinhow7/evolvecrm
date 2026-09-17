import type { Metadata } from 'next';
import { DecisionQueuePage } from '@/features/decisions/DecisionQueuePage'

export const metadata: Metadata = { title: 'Decisões | Sucção Zero CRM' };

export default function Decisions() {
    return <DecisionQueuePage />
}
