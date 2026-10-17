'use client';

import React from 'react';

/** Small trend line with fade fill and end dot (live status rows). */
export interface SparklineProps {
  data: number[];
  /** Hex colour (used in gradient stops). cyan #1B9FC0 · lime #A6CB2E · amber #F0A43A · bright cyan #43B7D4 */
  color?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  dot?: boolean;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Sparkline({ data = [], color = 'var(--cyan-500)', width = 200, height = 64, fill = true, dot = true, strokeWidth = 2.5, className = '', style }: SparklineProps) {
  const gid = 'sg' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  if (data.length < 2) return null;
  const lo = Math.min.apply(null, data), hi = Math.max.apply(null, data);
  const pad = 6;
  const x = (i) => pad + (i / (data.length - 1)) * (width - pad * 2);
  const y = (v) => pad + (height - pad * 2) * (1 - (v - lo) / (hi - lo || 1));
  const pts = data.map((v, i) => [x(i), y(v)]);
  let d = 'M' + pts[0][0] + ',' + pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6) + ',' + (p1[1] + (p2[1] - p0[1]) / 6) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6) + ',' + (p2[1] - (p3[1] - p1[1]) / 6) + ' ' + p2[0] + ',' + p2[1];
  }
  const last = pts[pts.length - 1];
  return (
    <svg className={'at-spark ' + className} width={width} height={height} viewBox={'0 0 ' + width + ' ' + height} style={style}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {fill ? <path d={d + ' L' + last[0] + ',' + height + ' L' + pts[0][0] + ',' + height + ' Z'} fill={'url(#' + gid + ')'} /> : null}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      {dot ? <circle cx={last[0]} cy={last[1]} r="4" fill={color} /> : null}
    </svg>
  );
}
