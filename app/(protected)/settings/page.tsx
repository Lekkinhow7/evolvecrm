import type { Metadata } from 'next';
import SettingsPage from '@/features/settings/SettingsPage'

export const metadata: Metadata = { title: 'Configurações | Sucção Zero CRM' };

export default function Settings() {
    return <SettingsPage />
}
