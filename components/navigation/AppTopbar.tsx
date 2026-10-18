'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { IconButton, Topbar } from '@/design-system';
import { useTheme } from '@/context/ThemeContext';
import { useUIState } from '@/store/uiState';
import { isDebugMode, enableDebugMode, disableDebugMode } from '@/lib/debug';
import { NotificationPopover } from '@/components/notifications/NotificationPopover';
import { getBreadcrumbs } from './shellNav';

/** Topo do CRM: caminho da tela à esquerda; IA, notificações e tema à direita. O botão de recolher fica no menu lateral. */
export function AppTopbar() {
  const pathname = usePathname();
  const { darkMode, toggleDarkMode } = useTheme();
  const { isGlobalAIOpen, setIsGlobalAIOpen } = useUIState();
  // `isDebugMode()` lê localStorage: sincroniza no mount para não divergir do SSR.
  const [debugEnabled, setDebugEnabled] = useState(false);
  useEffect(() => {
    setDebugEnabled(isDebugMode());
  }, []);

  const toggleDebugMode = () => {
    if (debugEnabled) disableDebugMode();
    else enableDebugMode();
    setDebugEnabled(!debugEnabled);
  };

  return (
    <Topbar
      crumbs={getBreadcrumbs(pathname)}
      langs={[]}
      theme={darkMode ? 'dark' : 'light'}
      onToggleTheme={toggleDarkMode}
      right={
        <>
          <IconButton
            icon="sparkles"
            label="Assistente de IA"
            variant={isGlobalAIOpen ? 'tinted' : 'ghost'}
            round
            aria-pressed={isGlobalAIOpen}
            onClick={() => setIsGlobalAIOpen(!isGlobalAIOpen)}
          />
          {process.env.NODE_ENV === 'development' ? (
            <IconButton icon="bug" label="Modo debug" variant={debugEnabled ? 'tinted' : 'ghost'} round aria-pressed={debugEnabled} onClick={toggleDebugMode} />
          ) : null}
          <NotificationPopover />
        </>
      }
    />
  );
}
