import type { RouteName } from '@/lib/prefetch';

/**
 * Fonte única do menu lateral e do caminho (breadcrumbs) do topo.
 * Spec: docs/superpowers/specs/2026-10-17-alice-interface-limpa-design.md
 */
export type ShellNavId =
  | 'inbox'
  | 'agenda'
  | 'messaging'
  | 'activities'
  | 'dashboard'
  | 'boards'
  | 'contacts'
  | 'reports'
  | 'ai'
  | 'decisions'
  | 'settings'
  | 'profile';
export type CrumbGroup = 'Dia a dia' | 'Comercial' | 'Inteligência' | 'Conta';

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
  inbox: { id: 'inbox', label: 'Minha mesa', href: '/inbox', icon: 'layout-list', prefetch: 'inbox', group: 'Dia a dia' },
  agenda: { id: 'agenda', label: 'Agenda', href: '/agenda', icon: 'calendar-days', prefetch: 'activities', group: 'Dia a dia' },
  messaging: { id: 'messaging', label: 'Conversas', href: '/messaging', icon: 'message-circle', group: 'Dia a dia' },
  activities: { id: 'activities', label: 'Tarefas', href: '/activities', icon: 'list-checks', prefetch: 'activities', group: 'Dia a dia' },
  dashboard: { id: 'dashboard', label: 'Visão geral', href: '/dashboard', icon: 'layout-grid', prefetch: 'dashboard', group: 'Comercial' },
  boards: { id: 'boards', label: 'Kanban', href: '/boards', icon: 'kanban', prefetch: 'boards', group: 'Comercial' },
  contacts: { id: 'contacts', label: 'Contatos', href: '/contacts', icon: 'users', prefetch: 'contacts', group: 'Comercial' },
  reports: { id: 'reports', label: 'Relatórios', href: '/reports', icon: 'chart-column', prefetch: 'reports', group: 'Comercial' },
  ai: { id: 'ai', label: 'Assistente IA', href: '/ai', icon: 'sparkles', group: 'Inteligência' },
  decisions: { id: 'decisions', label: 'Sugestões da IA', href: '/decisions', icon: 'lightbulb', group: 'Inteligência' },
  settings: { id: 'settings', label: 'Configurações', href: '/settings', icon: 'settings', prefetch: 'settings', group: 'Conta' },
  profile: { id: 'profile', label: 'Perfil', href: '/profile', icon: 'user', group: 'Conta' },
};

/**
 * Grupos do menu lateral. Configurações e Perfil ficam no cartão do usuário, no rodapé.
 * Assistente IA e Sugestões da IA não entram no menu: a IA abre pelo botão do topo, à direita.
 */
export const SIDEBAR_GROUPS: { label: CrumbGroup; items: ShellNavId[] }[] = [
  { label: 'Dia a dia', items: ['inbox', 'agenda', 'messaging', 'activities'] },
  { label: 'Comercial', items: ['dashboard', 'boards', 'contacts', 'reports'] },
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
