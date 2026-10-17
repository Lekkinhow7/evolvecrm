'use client';

import React from 'react';
import { ChartTooltip } from './ChartTooltip';

/** Capsule bar chart — hatched total behind a gradient value capsule, lime dot on top. */
export interface BarDatum {
  label: React.ReactNode;
  /** Filled (gradient) capsule height */
  value?: number;
  /** Hatched capsule behind (plan / total / forecast) */
  total?: number;
  /** cyan (default) or lime fill */
  tone?: 'cyan' | 'lime';
  /** Dashed empty capsule (no data / future) */
  empty?: boolean;
  dot?: boolean;
  highlight?: boolean;
  /** Default tooltip content (ChartTooltip props) */
  tooltip?: { title?: React.ReactNode; value: React.ReactNode; unit?: React.ReactNode; chip?: React.ReactNode };
}
export interface BarChartProps {
  data: BarDatum[];
  /** Value that maps to 100% height. Default 100. */
  max?: number;
  /** Y labels, top → bottom, e.g. ['100%','75%','50%','25%','0%'] */
  yTicks?: React.ReactNode[];
  /** px, default 300 */
  height?: number;
  dots?: boolean;
  /** Index whose tooltip is pinned open (hover overrides) */
  activeIndex?: number;
  barWidth?: number;
  gap?: number;
  renderTooltip?: (d: BarDatum, i: number) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function BarChart({ data = [], max = 100, yTicks, height = 300, dots = true, activeIndex, barWidth = 64, gap = 14, renderTooltip, className = '', style }: BarChartProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const act = hover != null ? hover : activeIndex;
  const pct = (v) => Math.max(0, Math.min(100, (v / max) * 100));
  return (
    <div className={'at-chart at-bars ' + className} style={Object.assign({ height }, style, yTicks ? {} : { gridTemplateColumns: '1fr' })}>
      {yTicks ? <div className="at-bars__y">{yTicks.map((t, i) => <span key={i}>{t}</span>)}</div> : null}
      <div className="at-bars__plot" style={{ '--bar-w': barWidth + 'px', '--bar-gap': gap + 'px' } as React.CSSProperties}>
        {data.map((d, i) => {
          const top = d.total != null ? pct(d.total) : pct(d.value || 0);
          const tip = act === i && (renderTooltip ? renderTooltip(d, i) : d.tooltip ? <ChartTooltip arrow="left" {...d.tooltip} /> : null);
          return (
            <div key={i} className={'at-bars__col ' + (act === i || d.highlight ? 'at-bars__col--hl' : '')} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <div className="at-bars__stack">
                {d.empty ? <span className="at-bars__empty" /> : null}
                {d.total != null && !d.empty ? <span className="at-bars__total" style={{ height: pct(d.total) + '%' }} /> : null}
                {d.value != null && !d.empty ? <span className={'at-bars__val ' + (d.tone === 'lime' ? 'at-bars__val--lime' : '')} style={{ height: pct(d.value) + '%' }} /> : null}
                {dots && !d.empty && d.dot !== false ? <span className="at-bars__dot" style={{ top: (100 - top) + '%', background: d.tone === 'lime' ? 'var(--white)' : undefined, boxShadow: d.tone === 'lime' ? '0 0 0 3px rgba(255,255,255,0.5)' : undefined }} /> : null}
                {tip ? <div className="at-bars__tip" style={{ top: (100 - top) + '%' }}>{tip}</div> : null}
              </div>
              <span className="at-bars__x">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
