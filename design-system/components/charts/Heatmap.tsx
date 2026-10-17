'use client';

import React from 'react';

/** Calendar heatmap (weeks × 7 days) — no events · planned · done · with deviations. */
export interface HeatmapProps {
  /** Array of weeks; each week = 7 levels: 0 none · 1 planned · 2 done · 3 deviation */
  weeks: Array<Array<0 | 1 | 2 | 3>>;
  /** Month labels positioned at a week column */
  months?: Array<{ label: string; col: number }>;
  /** Row labels (7). Pass null to hide. */
  days?: string[] | null;
  cellGap?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Heatmap({ weeks = [], months = [], days = ['Mon', '', 'Wed', '', 'Fri', '', ''], cellGap = 4, className = '', style }: HeatmapProps) {
  const cols = weeks.length;
  return (
    <div className={'at-chart ' + className} style={Object.assign({ display: 'grid', gridTemplateColumns: (days ? '36px ' : '') + 'minmax(0,1fr)', gap: '8px 8px' }, style)}>
      {days ? <span /> : null}
      <div className="at-heat__months" style={{ gridTemplateColumns: 'repeat(' + cols + ',minmax(0,1fr))', columnGap: cellGap }}>
        {months.map((m, i) => <span key={i} style={{ gridColumn: (m.col + 1) + ' / span 3', paddingLeft: 2 }}>{m.label}</span>)}
      </div>
      {days ? <div className="at-heat__days" style={{ gridTemplateRows: 'repeat(7,minmax(0,1fr))', rowGap: cellGap, alignItems: 'center' }}>{days.map((d, i) => <span key={i}>{d}</span>)}</div> : null}
      <div className="at-heat" style={{ gridTemplateColumns: 'repeat(' + cols + ',minmax(0,1fr))', gridTemplateRows: 'repeat(7,auto)', gridAutoFlow: 'column', gap: cellGap }}>
        {weeks.map((w, wi) => w.map((lv, di) => <span key={wi + '-' + di} className={'at-heat__cell ' + (lv ? 'at-heat__cell--' + lv : '')} />))}
      </div>
    </div>
  );
}
