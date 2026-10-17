'use client';

import React from 'react';

/** Status / meta pill. */
export interface BadgeProps {
  /**
   * info (cyan — Recorded, Due today, Valid, within limits) · success (lime — Done) · warning (amber — Due soon, Review)
   * · danger (red — Overdue) · active (ink — In progress) · neutral (grey meta — "7 days", "live", counts) · onDark · lime (on ink tooltips)
   */
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'active' | 'neutral' | 'onDark' | 'lime';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ tone = 'info', size = 'sm', dot = false, children, className = '', ...rest }: BadgeProps) {
  return (
    <span className={'at-badge at-badge--' + tone + ' ' + (size === 'md' ? 'at-badge--md ' : '') + className} {...rest}>
      {dot ? <span className="at-badge__dot" /> : null}
      {children}
    </span>
  );
}
