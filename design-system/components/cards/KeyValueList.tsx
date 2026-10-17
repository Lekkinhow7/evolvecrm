'use client';

import React from 'react';

/** Label/value rows separated by hairlines (Free · 4 shifts). */
export interface KeyValueItem { label: React.ReactNode; value: React.ReactNode }
export interface KeyValueListProps {
  items: KeyValueItem[];
  /** solid hairlines (default) or dashed */
  variant?: 'solid' | 'dashed';
  density?: 'md' | 'compact';
  /** Also draw a rule above the first row */
  ruled?: boolean;
  className?: string;
}

export function KeyValueList({ items = [], variant = 'solid', density = 'md', ruled = false, className = '' }: KeyValueListProps) {
  const cls = ['at-kv', variant === 'dashed' ? 'at-kv--dashed' : '', density === 'compact' ? 'at-kv--compact' : '', ruled ? 'at-kv--ruled' : '', className].filter(Boolean).join(' ');
  return (
    <dl className={cls}>
      {items.map((it, i) => (
        <div className="at-kv__row" key={i}><dt className="at-kv__k">{it.label}</dt><dd className="at-kv__v">{it.value}</dd></div>
      ))}
    </dl>
  );
}
