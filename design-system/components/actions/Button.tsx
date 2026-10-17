'use client';

import React from 'react';
import { Icon } from '../icons/Icon';

/**
 * Pill-shaped action button. Primary = deep ink; secondary = white with hairline; outline = ink ring.
 */
export interface ButtonProps {
  /** primary (ink, default) · secondary (white) · outline (ink ring) · accent (cyan) · accent-outline (cyan ring) · ghost · inverse (white on dark) */
  variant?: 'primary' | 'secondary' | 'outline' | 'accent' | 'accent-outline' | 'ghost' | 'inverse';
  /** sm 32px · md 44px (default) · lg 52px */
  size?: 'sm' | 'md' | 'lg';
  /** Lucide icon name before the label */
  icon?: string;
  /** Lucide icon name after the label */
  iconRight?: string;
  block?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  /** Renders an <a> when set */
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  children?: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', icon, iconRight, block = false, disabled = false, type = 'button', href, onClick, className = '', children, ...rest }: ButtonProps) {
  const cls = ['at-btn', 'at-btn--' + variant, 'at-btn--' + size, block ? 'at-btn--block' : '', className].filter(Boolean).join(' ');
  const is = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const inner = [
    icon ? <Icon key="i" name={icon} size={is} /> : null,
    children != null ? <span key="c">{children}</span> : null,
    iconRight ? <Icon key="r" name={iconRight} size={is} /> : null,
  ];
  if (href) return <a className={cls} href={href} onClick={onClick} {...rest}>{inner}</a>;
  return <button type={type} className={cls} disabled={disabled} onClick={onClick} {...rest}>{inner}</button>;
}
