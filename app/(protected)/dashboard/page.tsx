import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import DashboardPage from '@/features/dashboard/DashboardPage'

export const metadata: Metadata = { title: `Visão geral | ${CRM_NAME}` };

export default function Dashboard() {
    return <DashboardPage />
}
