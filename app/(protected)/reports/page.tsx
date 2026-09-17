import type { Metadata } from 'next';
import ReportsPage from '@/features/reports/ReportsPage'

export const metadata: Metadata = { title: 'Relatórios | Sucção0 CRM' };

export default function Reports() {
    return <ReportsPage />
}
