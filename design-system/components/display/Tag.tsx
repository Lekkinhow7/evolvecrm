'use client';

import React from 'react';

/** Chunky pill tag for zones / grades / permissions. */
export interface TagProps {
  /** cyan (granted, default) · outline (white, e.g. "no access") · ghostDark (outline on ink cards) */
  variant?: 'cyan' | 'outline' | 'ghostDark';
  size?: 'sm' | 'md';
  /** Circular 40px tag for 1–3 letter codes (A/B, C, D) */
  round?: boolean;
  /** Secondary small text after the label, e.g. "no access" */
  sub?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function Tag({ variant = 'cyan', size = 'md', round = false, sub, children, className = '', ...rest }: TagProps) {
  return (
    <span className={'at-tag at-tag--' + variant + ' ' + (size === 'sm' ? 'at-tag--sm ' : '') + (round ? 'at-tag--round ' : '') + className} {...rest}>
      {children}
      {sub ? <span className="at-tag__sub">{sub}</span> : null}
    </span>
  );
}
