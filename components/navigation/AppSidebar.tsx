'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Brand, IconButton, Sidebar } from '@/design-system';
import type { SidebarGroup } from '@/design-system';
import { CRM_NAME } from '@/lib/brand';
import { prefetchRoute } from '@/lib/prefetch';
import { SHELL_NAV, SIDEBAR_GROUPS, SIDEBAR_QUICK, formatBadge, getActiveNavId } from './shellNav';
import type { ShellNavId } from './shellNav';

export interface SidebarProfile {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
}

/** Nome e iniciais exibidos no cartão do usuário (mesma regra do menu antigo). */
export function getUserIdentity(profile: SidebarProfile | null | undefined): { name: string; initials: string } {
  const emailUser = profile?.email?.split('@')[0];
  const name = profile?.nickname || profile?.first_name || emailUser || 'Usuário';
  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : (profile?.nickname || profile?.email || 'U').substring(0, 2);
  return { name, initials: initials.toUpperCase() };
}

export interface AppSidebarProps {
  collapsed: boolean;
  unreadCount: number;
  profile: SidebarProfile | null | undefined;
  onSignOut: () => void;
}

/** Menu lateral do CRM montado com o Sidebar do design system. */
export function AppSidebar({ collapsed, unreadCount, profile, onSignOut }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { name, initials } = getUserIdentity(profile);
  const counts: Partial<Record<ShellNavId, string | undefined>> = { messaging: formatBadge(unreadCount) };

  const quick = SIDEBAR_QUICK.map((id) => ({ id, label: SHELL_NAV[id].label, icon: SHELL_NAV[id].icon, href: SHELL_NAV[id].href }));
  const groups: SidebarGroup[] = SIDEBAR_GROUPS.map((g) => ({
    label: g.label,
    items: g.items.map((id) => ({ id, label: SHELL_NAV[id].label, icon: SHELL_NAV[id].icon, href: SHELL_NAV[id].href, count: counts[id] })),
  }));

  const onPrefetch = (id: string) => {
    const route = SHELL_NAV[id as ShellNavId]?.prefetch;
    if (route) prefetchRoute(route);
  };

  return (
    <Sidebar
      brand={<Brand name={CRM_NAME} />}
      search={false}
      quickLabel="Acesso rápido"
      quick={quick}
      groups={groups}
      active={getActiveNavId(pathname)}
      linkAs={Link}
      onPrefetch={onPrefetch}
      collapsed={collapsed}
      user={{ initials, name, role: profile?.email || '', onClick: () => router.push('/profile') }}
      footer={<IconButton variant="tile" icon="log-out" label="Sair" onClick={onSignOut} />}
    />
  );
}
