'use client';

import React from 'react';
import { Icon } from '../icons/Icon';

/** Search field — pill (table toolbars), bare (sidebar), filled (mobile). */
export interface SearchInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  /** pill (white + border, default) · bare (bottom hairline only — sidebar) · filled (sunken bg) */
  variant?: 'pill' | 'bare' | 'filled';
  className?: string;
  style?: React.CSSProperties;
}

export function SearchInput({ value, defaultValue, onChange, placeholder = 'Search', variant = 'pill', className = '', style, ...rest }: SearchInputProps) {
  return (
    <label className={'at-search at-search--' + variant + ' ' + className} style={style}>
      <Icon name="search" size={16} />
      <input type="search" value={value} defaultValue={defaultValue} placeholder={placeholder} onChange={onChange ? (e) => onChange(e.target.value, e) : undefined} {...rest} />
    </label>
  );
}
