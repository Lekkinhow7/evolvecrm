import type { Metadata } from 'next';
import { FormsPage } from '@/features/forms/FormsPage'

export const metadata: Metadata = { title: 'Formulários | Sucção0 CRM' };

export default function Formularios() {
    return <FormsPage />
}
