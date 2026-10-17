'use client';

import React from 'react';

/** Single-select filter chips (All operations / Starts / Release). */
export interface ChipOption { value: string; label: React.ReactNode; count?: number }
export interface ChipGroupProps {
  options: Array<ChipOption | string>;
  value: string;
  onChange?: (value: string) => void;
  /** md 44px (default) · sm 32px */
  size?: 'sm' | 'md';
  className?: string;
}

export interface ChipProps {
  active?: boolean;
  size?: 'sm' | 'md';
  count?: number;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  children?: React.ReactNode;
}

export function Chip({ active = false, size = 'md', count, onClick, children, className = '', ...rest }: ChipProps) {
  return (
    <button type="button" className={'at-chip ' + (size === 'sm' ? 'at-chip--sm ' : '') + className} aria-pressed={active} onClick={onClick} {...rest}>
      {children}
      {count != null ? <span className="at-chip__count">{count}</span> : null}
    </button>
  );
}

export function ChipGroup({ options = [], value, onChange, size = 'md', className = '' }: ChipGroupProps) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div className={'at-chips ' + className} role="group">
      {opts.map((o) => (
        <Chip key={o.value} size={size} count={o.count} active={o.value === value} onClick={() => onChange && onChange(o.value)}>{o.label}</Chip>
      ))}
    </div>
  );
}
