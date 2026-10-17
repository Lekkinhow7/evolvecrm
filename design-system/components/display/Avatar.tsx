'use client';

import React from 'react';

/** Initials avatar — rounded square with cyan glass gradient. */
export interface AvatarProps {
  /** 1–2 letters, e.g. "IV" */
  initials: string;
  /** Pixel size. 32 (lists), 40 (sidebar user), 80 (pass card). */
  size?: number;
  /** Corner radius; defaults to 30% of size. Use size/2 for a circle. */
  radius?: number;
  variant?: 'gradient' | 'light';
  /** Photo URL; falls back to the initials when absent */
  src?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Avatar({ initials, size = 40, radius, variant = 'gradient', src, className = '', style }: AvatarProps) {
  const r = radius != null ? radius : Math.round(size * 0.3);
  return (
    <span className={'at-avatar ' + (variant === 'light' ? 'at-avatar--light ' : '') + className} style={Object.assign({ width: size, height: size, borderRadius: r, fontSize: Math.round(size * 0.36), overflow: src ? 'hidden' : undefined }, style)}>{src ? <img src={src} alt="" width={size} height={size} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}</span>
  );
}
