import { CRM_NAME } from '@/lib/brand';
import type { Metadata } from 'next';
import { ProfilePage } from '@/features/profile/ProfilePage'

export const metadata: Metadata = { title: `Perfil | ${CRM_NAME}` };

export default function Profile() {
    return <ProfilePage />
}
