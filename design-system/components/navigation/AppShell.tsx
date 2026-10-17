'use client';

import React from 'react';

/**
 * Responsive app frame: sticky glass sidebar on desktop (≥1024px), slide-in drawer with scrim on tablet/mobile.
 */
export interface AppShellProps {
  /** Usually <Sidebar … /> */
  sidebar: React.ReactNode;
  /** Drawer state below 1024px */
  drawerOpen?: boolean;
  onDrawerClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
  /** Topbar, PageHeader and page content */
  children?: React.ReactNode;
}

export function AppShell({ sidebar, drawerOpen = false, onDrawerClose, className = '', style, children }: AppShellProps) {
  return (
    <div className={'at-shell ' + (drawerOpen ? 'at-shell--open ' : '') + className} style={style}>
      <div className="at-shell__side">{sidebar}</div>
      <div className="at-shell__scrim" onClick={onDrawerClose} />
      <main className="at-shell__main">{children}</main>
    </div>
  );
}
