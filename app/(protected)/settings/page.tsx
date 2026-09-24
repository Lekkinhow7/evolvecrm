import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import SettingsPage from '@/features/settings/SettingsPage'

export const metadata: Metadata = { title: `Configurações | ${CRM_NAME}` };

export default function Settings() {
    return <SettingsPage />
}
