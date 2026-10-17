'use client';

import React from 'react';

/** Chart legend row. */
export interface LegendItem { label: React.ReactNode; color?: string; shape?: 'square' | 'dot' | 'hatch'; value?: React.ReactNode }
export interface LegendProps { items: LegendItem[]; className?: string; style?: React.CSSProperties }

export function Legend({ items = [], className = '', style }: LegendProps) {
  return (
    <div className={'at-legend ' + className} style={style}>
      {items.map((it, i) => (
        <span className="at-legend__item" key={i}>
          <span className={'at-legend__sw ' + (it.shape === 'dot' ? 'at-legend__sw--dot ' : '') + (it.shape === 'hatch' ? 'at-legend__sw--hatch' : '')} style={{ background: it.color }} />
          {it.label}
          {it.value != null ? <b>{it.value}</b> : null}
        </span>
      ))}
    </div>
  );
}
