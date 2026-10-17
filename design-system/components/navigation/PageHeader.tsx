'use client';

import React from 'react';

/** Page title (40px semibold) + one-line purpose subtitle + right-aligned actions. */
export interface PageHeaderProps {
  title: React.ReactNode;
  /** One sentence: what this page is for. Ends with a period. */
  subtitle?: React.ReactNode;
  /** Usually [secondary][primary] Buttons */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <header className={'at-pagehead ' + className}>
      <div style={{ minWidth: 0 }}>
        <h1 className="at-pagehead__title">{title}</h1>
        {subtitle ? <p className="at-pagehead__sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="at-pagehead__actions">{actions}</div> : null}
    </header>
  );
}
