import type { Metadata } from 'next';
import SettingsPage from '@/features/settings/SettingsPage'

export const metadata: Metadata = { title: 'IA – Configurações | Sucção0 CRM' };

export default function SettingsAI() {
  return <SettingsPage tab="ai" />
}
