import type { Metadata } from 'next';
import SettingsPage from '@/features/settings/SettingsPage'

export const metadata: Metadata = { title: 'Produtos | Sucção0 CRM' };

export default function SettingsProducts() {
  return <SettingsPage tab="products" />
}
