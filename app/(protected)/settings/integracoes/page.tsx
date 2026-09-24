import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import SettingsPage from '@/features/settings/SettingsPage'

export const metadata: Metadata = { title: `Integrações | ${CRM_NAME}` };

export default function SettingsIntegracoes() {
  return <SettingsPage tab="integrations" />
}
