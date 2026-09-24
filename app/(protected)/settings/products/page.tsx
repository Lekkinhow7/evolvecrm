import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import SettingsPage from '@/features/settings/SettingsPage'

export const metadata: Metadata = { title: `Produtos | ${CRM_NAME}` };

export default function SettingsProducts() {
  return <SettingsPage tab="products" />
}
