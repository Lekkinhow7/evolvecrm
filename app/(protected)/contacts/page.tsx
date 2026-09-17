import type { Metadata } from 'next';
import { ContactsPage } from '@/features/contacts/ContactsPage'

export const metadata: Metadata = { title: 'Contatos | Sucção0 CRM' };

export default function Contacts() {
    return <ContactsPage />
}
