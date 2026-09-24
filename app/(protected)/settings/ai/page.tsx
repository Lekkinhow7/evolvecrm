import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import SettingsPage from '@/features/settings/SettingsPage'

export const metadata: Metadata = { title: `IA – Configurações | ${CRM_NAME}` };

export default function SettingsAI() {
  return <SettingsPage tab="ai" />
}
