import type { Metadata } from 'next';
import DashboardPage from '@/features/dashboard/DashboardPage'

export const metadata: Metadata = { title: 'Dashboard | Sucção0 CRM' };

export default function Dashboard() {
    return <DashboardPage />
}
