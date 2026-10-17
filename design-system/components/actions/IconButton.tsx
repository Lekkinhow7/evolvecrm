'use client';

import React from 'react';
import { Icon } from '../icons/Icon';

/** Square or round icon-only button (collapse, theme, close, bell, logout). */
export interface IconButtonProps {
  /** Lucide icon name */
  icon: string;
  /** Accessible label (required) */
  label: string;
  /** soft (white + hairline, default) · ghost · tinted · dark · tile (stretchy footer tile) */
  variant?: 'soft' | 'ghost' | 'tinted' | 'dark' | 'tile';
  size?: 'sm' | 'md' | 'lg';
  /** Fully round (theme toggle, modal close) */
  round?: boolean;
  /** Red notification dot */
  dot?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export function IconButton({ icon, label, variant = 'soft', size = 'md', round = false, dot = false, disabled = false, onClick, className = '', ...rest }: IconButtonProps) {
  const cls = ['at-iconbtn', 'at-iconbtn--' + variant, variant === 'tile' ? '' : 'at-iconbtn--' + size, round ? 'at-iconbtn--round' : '', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} aria-label={label} title={label} disabled={disabled} onClick={onClick} {...rest}>
      <Icon name={icon} size={size === 'sm' ? 16 : 18} />
      {dot ? <span className="at-iconbtn__dot" /> : null}
    </button>
  );
}
