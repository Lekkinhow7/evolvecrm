'use client';

import React from 'react';

/** KPI card — small label, big pixel-font number, optional unit. */
export interface StatCardProps {
  /** e.g. "Overdue", "Closed this week" */
  label: React.ReactNode;
  /** The figure; rendered in the pixel display face. */
  value: React.ReactNode;
  /** Small trailing qualifier, e.g. "needs action", "batches", "% · limit 0.4%" */
  unit?: React.ReactNode;
  /**
   * white (default) · ink (attention / primary metric) · cyan (positive momentum) · lime (completed) · glass (over imagery)
   * Use at most one ink + one coloured card per KPI row.
   */
  variant?: 'white' | 'ink' | 'cyan' | 'lime' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  /** Top-right slot (badge or icon) */
  aside?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function StatCard({ label, value, unit, variant = 'white', size = 'md', aside, className = '', style, onClick }: StatCardProps) {
  const cls = ['at-stat', variant !== 'white' ? 'at-stat--' + variant : '', size !== 'md' ? 'at-stat--' + size : '', className].filter(Boolean).join(' ');
  return (
    <div className={cls} style={Object.assign(onClick ? { cursor: 'pointer' } : {}, style)} onClick={onClick}>
      <div className="at-stat__label">{label}</div>
      {aside ? <div className="at-stat__aside">{aside}</div> : null}
      <div className="at-stat__row">
        <span className="at-stat__value">{value}</span>
        {unit ? <span className="at-stat__unit">{unit}</span> : null}
      </div>
    </div>
  );
}
