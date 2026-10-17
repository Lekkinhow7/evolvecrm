'use client';

import React from 'react';

/** Tick-ring gauge — full ring (load %) or 200° arc (tank level, readiness). */
export interface TickGaugeProps {
  /** 0–100 fill */
  value: number;
  /** ring (default) · arc */
  variant?: 'ring' | 'arc';
  /** ink (default ring) · cyan (arc) · lime (personal progress) */
  color?: 'ink' | 'cyan' | 'lime';
  /** px width, default 140 */
  size?: number;
  ticks?: number;
  /** Centre text override, e.g. "720" */
  display?: React.ReactNode;
  /** Centre unit, default "%"; "m³", "" … */
  unit?: React.ReactNode;
  valueSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

const PALETTE = {
  ink: { on: 'var(--viz-2)', lead: 'var(--viz-gauge-lead)', off: 'var(--viz-track)' },
  cyan: { on: 'var(--cyan-500)', lead: 'var(--cyan-300)', off: 'var(--viz-track)' },
  lime: { on: 'var(--lime-500)', lead: 'var(--lime-300)', off: 'var(--viz-track)' },
};

export function TickGauge({ value = 0, variant = 'ring', color = 'ink', size = 140, ticks, display, unit = '%', valueSize, className = '', style }: TickGaugeProps) {
  const arc = variant === 'arc';
  const n = ticks || (arc ? 34 : 52);
  const start = arc ? -100 : 0, sweep = arc ? 200 : 360;
  const cx = size / 2, cy = size / 2, R = size / 2 - 3;
  const r1 = arc ? R * 0.66 : R * 0.76;
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * n);
  const p = PALETTE[color] || PALETTE.ink;
  const lines: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((start + (sweep * i) / (arc ? n - 1 : n)) * Math.PI) / 180;
    // Rounded so server and client render identical coordinates (avoids hydration mismatch).
    const r2 = (v: number) => Math.round(v * 100) / 100;
    const sx = r2(cx + Math.sin(a) * r1), sy = r2(cy - Math.cos(a) * r1), ex = r2(cx + Math.sin(a) * R), ey = r2(cy - Math.cos(a) * R);
    const on = i < filled;
    const lead = on && !arc && i >= filled - 4;
    lines.push(<line key={i} x1={sx} y1={sy} x2={ex} y2={ey} stroke={on ? (lead ? p.lead : p.on) : p.off} strokeWidth={arc ? size * 0.035 : size * 0.028} strokeLinecap="round" />);
  }
  const h = arc ? size * 0.62 : size;
  return (
    <div className={'at-gauge ' + className} style={Object.assign({ width: size, height: h }, style)}>
      <svg width={size} height={h} viewBox={'0 0 ' + size + ' ' + h} style={{ display: 'block', overflow: 'visible' }}>{lines}</svg>
      <div className="at-gauge__center" style={arc ? { alignItems: 'flex-end', paddingBottom: 0 } : undefined}>
        <span className="at-gauge__value" style={{ fontSize: valueSize || Math.round(size * (arc ? 0.2 : 0.18)) }}>{display != null ? display : Math.round(value)}{unit === '%' && !arc ? '%' : null}</span>
        {unit && !(unit === '%' && !arc) ? <span className="at-gauge__unit">{unit}</span> : null}
      </div>
    </div>
  );
}
