import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import { AIHubPage } from '@/features/ai-hub/AIHubPage'

export const metadata: Metadata = { title: `AI Hub | ${CRM_NAME}` };

export default function AIHub() {
    return <AIHubPage />
}
