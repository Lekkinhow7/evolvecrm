import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

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
vi.mock('./ai/UIChat', () => ({ UIChat: () => null }));
vi.mock('./notifications/NotificationPopover', () => ({ NotificationPopover: () => <span>notificacoes</span> }));
vi.mock('@/components/navigation', () => ({ BottomNav: () => null, MoreMenuSheet: () => null, NavigationRail: () => null }));

import Layout from './Layout';
import { useUIState } from '@/store/uiState';

describe('Layout (moldura do design system)', () => {
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
    const { getByText } = render(<Layout><p>conteudo</p></Layout>);
    expect(getByText('Comercial')).toBeTruthy();
  });

  it('mantém /messaging sem padding no conteúdo', () => {
    pathname = '/messaging';
    const { container } = render(<Layout><p>conteudo</p></Layout>);
    expect(container.querySelector('main#main-content')?.className).toContain('p-0');
  });

  it('atualiza --app-sidebar-width conforme o menu recolhido', async () => {
    useUIState.setState({ sidebarCollapsed: true });
    render(<Layout><p>conteudo</p></Layout>);
    await waitFor(() => expect(document.documentElement.style.getPropertyValue('--app-sidebar-width')).toBe('calc(var(--sidebar-collapsed) + 16px)'));
  });

  it('usa a largura cheia quando o menu está aberto', async () => {
    render(<Layout><p>conteudo</p></Layout>);
    await waitFor(() => expect(document.documentElement.style.getPropertyValue('--app-sidebar-width')).toBe('calc(var(--sidebar-width) + 16px)'));
  });
});
