'use client';

import React from 'react';

/** Compact pill switch — language toggle (PT / EN), small view toggles. */
export interface SegmentedOption { value: string; label: React.ReactNode }
export interface SegmentedProps {
  options: Array<SegmentedOption | string>;
  value: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md';
  /** caps (bold uppercase codes, default) · text (regular labels) */
  variant?: 'caps' | 'text';
  className?: string;
}

export function Segmented({ options = [], value, onChange, size = 'md', variant = 'caps', className = '', ...rest }: SegmentedProps) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div className={'at-seg ' + (size === 'sm' ? 'at-seg--sm ' : '') + (variant === 'text' ? 'at-seg--text ' : '') + className} role="group" {...rest}>
      {opts.map((o) => (
        <button key={o.value} type="button" className="at-seg__opt" aria-pressed={o.value === value} onClick={() => onChange && onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}
