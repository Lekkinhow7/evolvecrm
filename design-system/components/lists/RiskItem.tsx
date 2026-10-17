'use client';

import React from 'react';
import { Icon } from '../icons/Icon';
import { Badge } from '../display/Badge';

/** Risk / alert row: tinted icon well, title, unit, due line, status badge. */
export interface RiskItemProps {
  /** Lucide icon; defaults to triangle-alert (danger) or refresh-cw */
  icon?: string;
  tone?: 'danger' | 'warning' | 'info' | 'success';
  title: React.ReactNode;
  /** Owning unit, e.g. "Laboratory" */
  unit?: React.ReactNode;
  /** e.g. "Was due 03.09.2026" */
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const WELL = { danger: ['var(--status-danger-bg)', 'var(--status-danger-fg)'], warning: ['var(--status-warning-bg)', 'var(--status-warning-fg)'], info: ['var(--status-info-bg)', 'var(--status-info-fg)'], success: ['var(--status-success-bg)', 'var(--status-success-fg)'] };

export function RiskItem({ icon, tone = 'danger', title, unit, meta, badge, onClick, className = '' }: RiskItemProps) {
  const w = WELL[tone] || WELL.info;
  return (
    <div className={'at-risk ' + className} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <span className="at-risk__icon" style={{ background: w[0], color: w[1] }}><Icon name={icon || (tone === 'danger' ? 'triangle-alert' : 'refresh-cw')} size={18} /></span>
      <div className="at-risk__body">
        <div className="at-risk__title">{title}</div>
        {unit ? <div className="at-risk__unit">{unit}</div> : null}
        {meta ? <div className="at-risk__meta">{meta}</div> : null}
      </div>
      {badge ? <span className="at-risk__badge"><Badge tone={tone}>{badge}</Badge></span> : null}
    </div>
  );
}
