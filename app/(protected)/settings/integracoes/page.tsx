import type { Metadata } from 'next';
import SettingsPage from '@/features/settings/SettingsPage'

export const metadata: Metadata = { title: 'Integrações | Sucção0 CRM' };

export default function SettingsIntegracoes() {
  return <SettingsPage tab="integrations" />
}
