import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import { BoardsPage } from '@/features/boards/BoardsPage'

export const metadata: Metadata = { title: `Kanban | ${CRM_NAME}` };

export default function Boards() {
    return <BoardsPage />
}
