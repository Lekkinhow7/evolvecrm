'use client';

import React from 'react';
import { ChartTooltip } from './ChartTooltip';

/** Smooth single-series line with soft cyan area fill; hover scrubs a point + tooltip. */
export interface AreaChartProps {
  data: number[];
  /** X labels, same length as data */
  labels?: React.ReactNode[];
  min?: number;
  max?: number;
  /** Number of horizontal grid lines / y labels. Default 6. */
  yTicks?: number;
  formatY?: (v: number) => string;
  /** px, default 280 */
  height?: number;
  color?: string;
  activeIndex?: number;
  /** Return a <ChartTooltip variant="line" …/> */
  renderTooltip?: (value: number, index: number) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function smooth(pts) {
  if (pts.length < 2) return '';
  let d = 'M' + pts[0][0] + ',' + pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2[0] + ',' + p2[1];
  }
  return d;
}

export function AreaChart({ data = [], labels = [], min, max, yTicks = 6, formatY, height = 280, color = 'var(--cyan-500)', activeIndex, renderTooltip, className = '', style }: AreaChartProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(600);
  const [hover, setHover] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((e) => setW(Math.max(200, e[0].contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const gid = 'ag' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const lo = min != null ? min : Math.min.apply(null, data), hi = max != null ? max : Math.max.apply(null, data);
  const padL = 64, padR = 12, padT = 12, padB = 34;
  const iw = w - padL - padR, ih = height - padT - padB;
  const x = (i) => padL + (data.length > 1 ? (i / (data.length - 1)) * iw : iw / 2);
  const y = (v) => padT + ih - ((v - lo) / (hi - lo || 1)) * ih;
  const pts = data.map((v, i) => [x(i), y(v)]);
  const line = smooth(pts);
  const area = line ? line + ' L' + x(data.length - 1) + ',' + (padT + ih) + ' L' + x(0) + ',' + (padT + ih) + ' Z' : '';
  const ticks: number[] = [];
  for (let t = 0; t < yTicks; t++) { const v = hi - ((hi - lo) / (yTicks - 1)) * t; ticks.push(v); }
  const act = hover != null ? hover : activeIndex;
  const fmt = formatY || ((v) => Math.round(v).toLocaleString('ru-RU'));
  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0, bd = 1e9;
    pts.forEach((p, i) => { const dd = Math.abs(p[0] - px); if (dd < bd) { bd = dd; best = i; } });
    setHover(best);
  };
  return (
    <div ref={ref} className={'at-chart ' + className} style={Object.assign({ height }, style)} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--cyan-500)" stopOpacity="0.2" /><stop offset="1" stopColor="var(--cyan-500)" stopOpacity="0" /></linearGradient>
        </defs>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} stroke="var(--viz-grid)" strokeWidth="1" />
            <text x={padL - 14} y={y(v) + 4} textAnchor="end" className="at-chart__axis">{fmt(v)}</text>
          </g>
        ))}
        {labels.map((l, i) => <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="at-chart__axis" style={{ fontSize: 13, fill: act === i ? 'var(--text-primary)' : undefined }}>{l}</text>)}
        <path d={area} fill={'url(#' + gid + ')'} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        {act != null && pts[act] ? (
          <g>
            <line x1={pts[act][0]} x2={pts[act][0]} y1={padT} y2={padT + ih} stroke="var(--slate-300)" strokeDasharray="3 4" />
            <circle cx={pts[act][0]} cy={pts[act][1]} r="7" fill="var(--surface-card)" stroke={color} strokeWidth="2.5" />
          </g>
        ) : null}
      </svg>
      {act != null && pts[act] && renderTooltip ? (
        <div style={{ position: 'absolute', left: Math.min(Math.max(pts[act][0], 120), w - 120), top: pts[act][1] - 18, transform: 'translate(-50%,-100%)', zIndex: 2 }}>{renderTooltip(data[act], act)}</div>
      ) : null}
    </div>
  );
}
