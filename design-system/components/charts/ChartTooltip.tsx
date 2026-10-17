'use client';

import React from 'react';
import { Badge } from '../display/Badge';

/** Dark ink chart tooltip — date title, big value + unit, optional lime delta chip. */
export interface ChartTooltipProps {
  /** e.g. "Wednesday, 26.08" */
  title?: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  /** Series label (line variant), e.g. "Output" */
  label?: React.ReactNode;
  /** Lime chip, e.g. "Completed 34%", "+1.7 vs average" */
  chip?: React.ReactNode;
  /** big (default) · line (series label with cyan tick, compact value) */
  variant?: 'big' | 'line';
  arrow?: 'none' | 'left' | 'bottom';
  className?: string;
  style?: React.CSSProperties;
}

export function ChartTooltip({ title, value, unit, label, chip, variant = 'big', arrow = 'none', className = '', style }: ChartTooltipProps) {
  return (
    <div className={'at-tip ' + (variant === 'line' ? 'at-tip--line ' : '') + (arrow !== 'none' ? 'at-tip--' + arrow + ' ' : '') + className} style={style}>
      {arrow !== 'none' ? <span className="at-tip__arrow" /> : null}
      {title ? <div className="at-tip__title">{title}</div> : null}
      <div className="at-tip__row">
        {label ? <span className="at-tip__label">{label}</span> : null}
        <span className="at-tip__value">{value}</span>
        {unit ? <span className="at-tip__unit">{unit}</span> : null}
      </div>
      {chip ? <Badge tone="lime" className="at-tip__chip">{chip}</Badge> : null}
    </div>
  );
}
