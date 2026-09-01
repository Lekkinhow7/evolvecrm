import type { Metadata } from 'next';
import DashboardPage from '@/features/dashboard/DashboardPage'

export const metadata: Metadata = { title: 'Dashboard | Evolve CRM' };

export default function Dashboard() {
    return <DashboardPage />
}
