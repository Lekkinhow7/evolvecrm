import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import { MessagingPage } from '@/features/messaging/MessagingPage'

export const metadata: Metadata = { title: `Mensagens | ${CRM_NAME}` };

export default function Messaging() {
    return <MessagingPage />
}
