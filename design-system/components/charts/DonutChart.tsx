'use client';

import React from 'react';

/** Status donut with gapped segments, raised centre disc and pixel-font total. */
export interface DonutSegment { value: number; color: string; label?: string }
export interface DonutChartProps {
  segments: DonutSegment[];
  /** px, default 220 */
  size?: number;
  thickness?: number;
  /** Gap between segments (px each side) */
  gap?: number;
  /** Centre figure, e.g. 25 */
  value?: React.ReactNode;
  /** Centre caption, e.g. "total tasks" */
  label?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function DonutChart({ segments = [], size = 220, thickness = 34, gap = 3, value, label, className = '', style }: DonutChartProps) {
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let off = 0;
  const hole = size - thickness * 2 - 16;
  return (
    <div className={'at-donut ' + className} style={Object.assign({ width: size, height: size }, style)}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--viz-track)" strokeWidth={thickness + 10} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const gl = segments.length > 1 ? Math.min(gap * 2, len * 0.5) : 0;
          const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeDasharray={Math.max(0, len - gl) + ' ' + (c - Math.max(0, len - gl))} strokeDashoffset={-(off + gl / 2)} />;
          off += len;
          return el;
        })}
      </svg>
      <span className="at-donut__hole" style={{ width: hole, height: hole, left: (size - hole) / 2, top: (size - hole) / 2 }} />
      <div className="at-donut__center">
        {value != null ? <div className="at-donut__value">{value}</div> : null}
        {label ? <div className="at-donut__label">{label}</div> : null}
      </div>
    </div>
  );
}
