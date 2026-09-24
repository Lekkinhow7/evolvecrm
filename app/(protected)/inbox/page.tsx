import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import { InboxPage } from '@/features/inbox/InboxPage'

export const metadata: Metadata = { title: `Inbox | ${CRM_NAME}` };

export default function Inbox() {
    return <InboxPage />
}
