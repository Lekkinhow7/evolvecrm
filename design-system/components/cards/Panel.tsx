'use client';

import React from 'react';

/**
 * Content card — the main container for charts, tables and lists on a dashboard.
 */
export interface PanelProps {
  /** Card title (18px medium) */
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right-aligned meta, usually <Badge tone="neutral">7 days</Badge> */
  meta?: React.ReactNode;
  /** Extra right-aligned controls */
  actions?: React.ReactNode;
  /** card (white, default) · glass (frosted) · tint (mist, no shadow) · ink (dark gradient) */
  variant?: 'card' | 'glass' | 'tint' | 'ink';
  /** md 24px (default) · sm 20px · none */
  padding?: 'md' | 'sm' | 'none';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function Panel({ title, subtitle, meta, actions, variant = 'card', padding = 'md', className = '', style, children, ...rest }: PanelProps) {
  const cls = ['at-panel', variant !== 'card' ? 'at-panel--' + variant : '', padding === 'sm' ? 'at-panel--compact' : '', padding === 'none' ? 'at-panel--flush' : '', className].filter(Boolean).join(' ');
  const hasHead = title || meta || actions;
  return (
    <section className={cls} style={style} {...rest}>
      {hasHead ? (
        <header className="at-panel__head">
          <div style={{ minWidth: 0 }}>
            {title ? <h3 className="at-panel__title">{title}</h3> : null}
            {subtitle ? <p className="at-panel__sub">{subtitle}</p> : null}
          </div>
          {meta || actions ? <div className="at-panel__meta">{meta}{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
