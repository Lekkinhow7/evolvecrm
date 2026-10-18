import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

let pathname = '/dashboard';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children?: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' }, loading: false, profile: { email: 'ana@x.com' }, signOut: vi.fn() }),
}));
vi.mock('../context/ThemeContext', () => ({ useTheme: () => ({ darkMode: false, toggleDarkMode: vi.fn() }) }));
vi.mock('@/hooks/useResponsiveMode', () => ({ useResponsiveMode: () => ({ mode: 'desktop', width: 1440 }) }));
vi.mock('@/lib/query/hooks/useConversationsQuery', () => ({ useUnreadCount: () => ({ data: 0 }) }));
vi.mock('@/lib/query/hooks/useActivitiesQuery', () => ({ usePendingActivities: () => ({ data: [] }) }));
vi.mock('@/lib/query/hooks/useDealsQuery', () => ({ useDeals: () => ({ data: [] }) }));
vi.mock('@/lib/query/hooks/useBoardsQuery', () => ({ useBoards: () => ({ data: [] }) }));
vi.mock('@/lib/brand', () => ({ CRM_NAME: 'Alice Teixeira', CRM_TAGLINE: 'Advocacia' }));
vi.mock('./ai/UIChat', () => ({ UIChat: () => null }));
vi.mock('./notifications/NotificationPopover', () => ({ NotificationPopover: () => <span>notificacoes</span> }));
vi.mock('@/components/navigation', () => ({ BottomNav: () => null, MoreMenuSheet: () => null, NavigationRail: () => null }));

import Layout from './Layout';
import { useUIState } from '@/store/uiState';

describe('Layout (moldura do CRM)', () => {
  beforeEach(() => {
    pathname = '/dashboard';
    useUIState.setState({ sidebarCollapsed: false, isGlobalAIOpen: false });
  });
  afterEach(() => {
    document.documentElement.style.removeProperty('--app-sidebar-width');
  });

  it('não tem grade de pontos nem manchas desfocadas no fundo', () => {
    const { container } = render(<Layout><p>conteudo</p></Layout>);
    expect(container.querySelector('.bg-dots')).toBeNull();
    expect(container.querySelector('[class*="blur-[100px]"]')).toBeNull();
  });

  it('mostra o caminho da tela no topo', () => {
    render(<Layout><p>conteudo</p></Layout>);
    const header = screen.getByRole('banner');
    expect(header.textContent).toContain('Comercial');
    expect(header.textContent).toContain('Visão geral');
  });

  it('não repete o nome do CRM no topo; ele fica só no menu', () => {
    render(<Layout><p>conteudo</p></Layout>);
    expect(screen.getByRole('banner').textContent).not.toContain('Alice Teixeira');
    expect(screen.getAllByText('Alice Teixeira')).toHaveLength(1);
  });

  it('o botão do menu recolhe e abre a sidebar', () => {
    render(<Layout><p>conteudo</p></Layout>);
    fireEvent.click(screen.getByRole('button', { name: 'Recolher menu' }));
    expect(useUIState.getState().sidebarCollapsed).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(useUIState.getState().sidebarCollapsed).toBe(false);
  });

  it('atualiza --app-sidebar-width conforme o menu recolhido', async () => {
    useUIState.setState({ sidebarCollapsed: true });
    render(<Layout><p>conteudo</p></Layout>);
    await waitFor(() => expect(document.documentElement.style.getPropertyValue('--app-sidebar-width')).toBe('var(--sidebar-collapsed)'));
  });

  it('usa a largura cheia quando o menu está aberto', async () => {
    render(<Layout><p>conteudo</p></Layout>);
    await waitFor(() => expect(document.documentElement.style.getPropertyValue('--app-sidebar-width')).toBe('var(--sidebar-width)'));
  });
});
