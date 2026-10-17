'use client';

import React from 'react';

/** Thin rounded progress bar (treatment cycles, task completion). */
export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: 'cyan' | 'lime' | 'danger';
  /** px, default 6 */
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Row of short rounded segments (weekly status strip on MetricCard). */
export interface SegmentedProgressProps {
  segments?: number;
  /** Per-segment state: 0 empty · 1 light cyan · 2 strong cyan */
  filled?: Array<0 | 1 | 2>;
  onDark?: boolean;
  className?: string;
}

export function ProgressBar({ value = 0, max = 100, tone = 'cyan', height = 6, className = '', style }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={'at-progress ' + (tone !== 'cyan' ? 'at-progress--' + tone + ' ' : '') + className} style={Object.assign({ height }, style)} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="at-progress__fill" style={{ width: pct + '%' }} />
    </div>
  );
}

export function SegmentedProgress({ segments = 7, filled = [], onDark = false, className = '' }: SegmentedProgressProps) {
  const arr: React.ReactElement[] = [];
  for (let i = 0; i < segments; i++) {
    const f = filled[i];
    arr.push(<span key={i} className={'at-segs__s ' + (f === 2 ? 'at-segs__s--strong' : f ? 'at-segs__s--on' : '')} />);
  }
  return <div className={'at-segs ' + (onDark ? 'at-segs--onDark ' : '') + className}>{arr}</div>;
}
