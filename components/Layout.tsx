/**
 * @fileoverview Layout Principal da Aplicação
 *
 * Componente de layout que fornece estrutura base para todas as páginas,
 * incluindo sidebar de navegação, header e área de conteúdo.
 * O menu lateral fica em `components/navigation/AppSidebar` e o topo em `AppTopbar`
 * (este usa o Topbar do design system da Alice).
 *
 * @module components/Layout
 *
 * Recursos de Acessibilidade:
 * - Skip link para navegação por teclado
 * - Navegação com aria-current para página ativa
 * - Ícones decorativos com aria-hidden
 * - Suporte a prefetch em hover/focus
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <Layout>
 *       <PageContent />
 *     </Layout>
 *   );
 * }
 * ```
 */

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useUIState } from '@/store/uiState';
import { SkipLink } from '@/lib/a11y';
import { useResponsiveMode } from '@/hooks/useResponsiveMode';
import { BottomNav, MoreMenuSheet, NavigationRail } from '@/components/navigation';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { AppTopbar } from '@/components/navigation/AppTopbar';
import { useUnreadCount } from '@/lib/query/hooks/useConversationsQuery';
import { usePendingActivities } from '@/lib/query/hooks/useActivitiesQuery';
import { getNextAppointment } from '@/components/navigation/nextAppointment';
import { countStalledDeals, getActivityStats } from '@/components/navigation/sidebarStats';
import { useDeals } from '@/lib/query/hooks/useDealsQuery';
import { useBoards } from '@/lib/query/hooks/useBoardsQuery';
import { UIChat } from './ai/UIChat';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Menu lateral do desktop com os números que ele mostra (hoje, atrasadas, negócios parados, funis).
 * Fica num componente próprio para essas consultas só rodarem quando o menu aparece (não no celular/tablet).
 */
function DesktopSidebar(props: Omit<React.ComponentProps<typeof AppSidebar>, 'activityStats' | 'stalledDeals' | 'funnels' | 'nextAppointment'>) {
  // Próximo compromisso e resumo de hoje (undefined enquanto carrega esconde os blocos)
  const { data: pendingActivities } = usePendingActivities();
  const nextAppointment = pendingActivities ? (getNextAppointment(pendingActivities) ?? null) : undefined;
  const activityStats = pendingActivities ? getActivityStats(pendingActivities) : undefined;

  // Negócios parados no Kanban e atalhos dos funis (mesmos caches do Kanban e da Visão geral)
  const { data: deals } = useDeals();
  const stalledDeals = deals ? countStalledDeals(deals) : undefined;
  const { data: boards = [] } = useBoards();
  const funnels = boards.map((b) => ({ id: b.id, name: b.name }));

  return (
    <AppSidebar
      {...props}
      activityStats={activityStats}
      stalledDeals={stalledDeals}
      funnels={funnels}
      nextAppointment={nextAppointment}
    />
  );
}

/** Largura ocupada pela sidebar no desktop (o menu encosta na borda esquerda, sem respiro). */
const SIDEBAR_SPACE = {
  open: 'var(--sidebar-width)',
  collapsed: 'var(--sidebar-collapsed)',
};

/**
 * Layout principal da aplicação
 *
 * Fornece estrutura com sidebar fixa, header responsivo e área de conteúdo.
 * Inclui navegação, controles de tema e acesso ao assistente de IA.
 *
 * @param {LayoutProps} props - Props do componente
 * @returns {JSX.Element} Estrutura de layout completa
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isGlobalAIOpen, sidebarCollapsed } = useUIState();
  const { user, loading, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { mode } = useResponsiveMode();
  const isMobile = mode === 'mobile';
  const isTablet = mode === 'tablet';
  const isDesktop = mode === 'desktop';
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Messaging unread count for notification badge
  const { data: unreadMessagesCount = 0 } = useUnreadCount();

  // If the user signed out (or session expired), leave protected shell ASAP.
  // This prevents rendering fallbacks like "Usuário" while unauthenticated.
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
  }, [loading, user, router]);

  // Expose sidebar width as a global CSS var so modals/overlays can "shrink" on desktop
  // instead of covering the navigation sidebar (works even for portals).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const width =
      isDesktop ? (sidebarCollapsed ? SIDEBAR_SPACE.collapsed : SIDEBAR_SPACE.open)
        : isTablet ? '5rem'
          : '0px';
    document.documentElement.style.setProperty('--app-sidebar-width', width);
  }, [isDesktop, isTablet, sidebarCollapsed]);

  // Cleanup on unmount (e.g. leaving the app shell).
  useEffect(() => {
    return () => {
      if (typeof document === 'undefined') return;
      document.documentElement.style.setProperty('--app-sidebar-width', '0px');
    };
  }, []);

  // Expose bottom nav height so the content can pad itself and avoid being covered.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--app-bottom-nav-height', isMobile ? '56px' : '0px');
  }, [isMobile]);

  // Close "More" menu when route changes.
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  if (!loading && !user) return null;

  const isMessaging = pathname === '/messaging' || pathname.startsWith('/messaging/');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      {/* Skip Link for keyboard users */}
      <SkipLink targetId="main-content" />

      {/* Tablet rail (shows full icon set; no "More" sheet needed) */}
      {isTablet ? <NavigationRail /> : null}

      {/* Menu lateral (desktop) */}
      {isDesktop ? (
        <div className="hidden md:flex shrink-0 z-20">
          <DesktopSidebar
            collapsed={sidebarCollapsed}
            unreadCount={unreadMessagesCount}
            profile={profile}
            onSignOut={signOut}
          />
        </div>
      ) : null}

      {/* Main Content Wrapper */}
      <div className="flex-1 flex min-w-0 overflow-hidden relative">
        {/* Middle Content (Header + Page) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Em Conversas o conteúdo vai até a borda: a barra fica centrada na faixa, com respiro embaixo. */}
          <header className={`shrink-0 z-40 px-6 ${isMessaging ? 'py-3' : 'pt-4'}`} role="banner">
            <AppTopbar showSidebarToggle={isDesktop} />
          </header>

          <main
            id="main-content"
            className={`flex-1 overflow-auto relative scroll-smooth ${
              isMessaging
                ? 'p-0'
                : 'p-6 pb-[calc(1.5rem+var(--app-bottom-nav-height,0px)+var(--app-safe-area-bottom,0px))]'
            }`}
            tabIndex={-1}
          >
            {children}
          </main>
        </div>

        {/* Right Sidebar (AI Assistant) */}
        <aside
          aria-label="Assistente de IA"
          aria-hidden={!isGlobalAIOpen}
          className={`border-l border-[var(--color-border)] bg-surface transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${isGlobalAIOpen ? 'w-96 opacity-100' : 'w-0 opacity-0'}`}
        >
          <div className="w-96 h-full">
            {isGlobalAIOpen && (
              <UIChat />
            )}
          </div>
        </aside>
      </div>

      {/* Mobile app shell */}
      <BottomNav onOpenMore={() => setIsMoreOpen(true)} />
      <MoreMenuSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </div>
  );
};

export default Layout;
