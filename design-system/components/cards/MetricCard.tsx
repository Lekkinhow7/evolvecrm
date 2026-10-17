'use client';

import React from 'react';
import { Icon } from '../icons/Icon';
import { Badge } from '../display/Badge';
import { SegmentedProgress } from '../display/ProgressBar';

/** Compact metric tile: icon well + status badge, value, title, sub-line, segmented strip. */
export interface MetricCardProps {
  /** Lucide icon in the tinted well */
  icon?: string;
  /** Status text, e.g. "within limits", "2 deviations" */
  badge?: string;
  badgeTone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  value: React.ReactNode;
  unit?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional 7-segment strip; 0 empty · 1 light · 2 strong */
  segments?: Array<0 | 1 | 2>;
  className?: string;
  style?: React.CSSProperties;
}

export function MetricCard({ icon, badge, badgeTone = 'info', value, unit, title, subtitle, segments, className = '', style }: MetricCardProps) {
  return (
    <div className={'at-metric ' + className} style={style}>
      <div className="at-metric__top">
        {icon ? <span className="at-metric__icon"><Icon name={icon} size={18} /></span> : <span />}
        {badge ? <Badge tone={badgeTone}>{badge}</Badge> : null}
      </div>
      <div>
        <div className="at-metric__value">{value}{unit ? <span className="at-metric__unit">{unit}</span> : null}</div>
        <div className="at-metric__title" style={{ marginTop: 10 }}>{title}</div>
        {subtitle ? <div className="at-metric__sub">{subtitle}</div> : null}
      </div>
      {segments ? <SegmentedProgress filled={segments} /> : null}
    </div>
  );
}
