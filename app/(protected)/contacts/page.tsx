import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import { ContactsPage } from '@/features/contacts/ContactsPage'

export const metadata: Metadata = { title: `Contatos | ${CRM_NAME}` };

export default function Contacts() {
    return <ContactsPage />
}
