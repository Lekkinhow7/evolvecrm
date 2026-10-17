'use client';

import React from 'react';
import { Icon } from '../icons/Icon';

/** Navigable list row: icon well, title/sub, trailing chevron or custom slot. */
export interface ListRowProps {
  icon?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Replaces the chevron */
  trailing?: React.ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListRow({ icon, title, subtitle, trailing, chevron = true, onClick, className = '' }: ListRowProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={'at-row ' + className} onClick={onClick}>
      {icon ? <span className="at-row__icon"><Icon name={icon} size={18} /></span> : null}
      <span className="at-row__body"><div className="at-row__title">{title}</div>{subtitle ? <div className="at-row__sub">{subtitle}</div> : null}</span>
      {trailing}
      {chevron && !trailing ? <Icon name="chevron-right" size={16} className="at-row__chev" /> : null}
    </Tag>
  );
}
