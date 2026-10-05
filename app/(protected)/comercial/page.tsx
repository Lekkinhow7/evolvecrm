import type { Metadata } from 'next';
import { ComercialPage } from '@/features/comercial/ComercialPage'

export const metadata: Metadata = { title: 'Comercial | Sucção0 CRM' };

export default function Comercial() {
    return <ComercialPage />
}
