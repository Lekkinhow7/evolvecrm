import type { RouteName } from '@/lib/prefetch';

/**
 * Fonte única do menu lateral e do caminho (breadcrumbs) do topo.
 * Spec: docs/superpowers/specs/2026-10-17-alice-interface-limpa-design.md
 */
export type ShellNavId = 'inbox' | 'messaging' | 'dashboard' | 'boards' | 'contacts' | 'activities' | 'reports' | 'settings' | 'profile';
export type CrumbGroup = 'Trabalho' | 'Comercial' | 'Relacionamento' | 'Conta';

export interface ShellNavItem {
  id: ShellNavId;
  label: string;
  href: string;
  /** Lucide icon name, kebab-case (Icon do design system). */
  icon: string;
  prefetch?: RouteName;
  group: CrumbGroup;
}

export const SHELL_NAV: Record<ShellNavId, ShellNavItem> = {
  inbox: { id: 'inbox', label: 'Inbox', href: '/inbox', icon: 'inbox', prefetch: 'inbox', group: 'Trabalho' },
  messaging: { id: 'messaging', label: 'Mensagens', href: '/messaging', icon: 'message-circle', group: 'Trabalho' },
  activities: { id: 'activities', label: 'Atividades', href: '/activities', icon: 'calendar-check', prefetch: 'activities', group: 'Trabalho' },
  dashboard: { id: 'dashboard', label: 'Visão geral', href: '/dashboard', icon: 'activity', prefetch: 'dashboard', group: 'Comercial' },
  boards: { id: 'boards', label: 'Negócios', href: '/boards', icon: 'briefcase', prefetch: 'boards', group: 'Comercial' },
  reports: { id: 'reports', label: 'Relatórios', href: '/reports', icon: 'chart-column', prefetch: 'reports', group: 'Comercial' },
  contacts: { id: 'contacts', label: 'Contatos', href: '/contacts', icon: 'users', prefetch: 'contacts', group: 'Relacionamento' },
  settings: { id: 'settings', label: 'Configurações', href: '/settings', icon: 'settings', prefetch: 'settings', group: 'Conta' },
  profile: { id: 'profile', label: 'Perfil', href: '/profile', icon: 'user', group: 'Conta' },
};

export const SIDEBAR_QUICK: ShellNavId[] = ['inbox', 'dashboard', 'boards', 'activities'];

export const SIDEBAR_GROUPS: { label: string; items: ShellNavId[] }[] = [
  { label: 'Relacionamento', items: ['contacts', 'messaging'] },
  { label: 'Gestão', items: ['reports', 'settings'] },
];

/** Rotas antigas que pertencem a um item do menu. */
const ALIASES: Record<string, ShellNavId> = { '/pipeline': 'boards' };

export function getActiveNavId(pathname: string): ShellNavId | undefined {
  for (const [prefix, id] of Object.entries(ALIASES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return id;
  }
  return Object.values(SHELL_NAV).find((item) => pathname === item.href || pathname.startsWith(item.href + '/'))?.id;
}

export function getBreadcrumbs(pathname: string): { label: string }[] {
  const id = getActiveNavId(pathname);
  if (!id) return [];
  const item = SHELL_NAV[id];
  return [{ label: item.group }, { label: item.label }];
}

export function formatBadge(count: number | undefined): string | undefined {
  if (!count || count <= 0) return undefined;
  return count > 99 ? '99+' : String(count);
}
