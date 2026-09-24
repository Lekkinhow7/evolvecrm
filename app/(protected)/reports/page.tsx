import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import ReportsPage from '@/features/reports/ReportsPage'

export const metadata: Metadata = { title: `Relatórios | ${CRM_NAME}` };

export default function Reports() {
    return <ReportsPage />
}
