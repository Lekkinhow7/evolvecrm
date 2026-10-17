'use client';

import React from 'react';

/** Small summary tile: uppercase micro label + value (STATUS / Valid). */
export interface InfoTileProps {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function InfoTile({ label, value, className = '', style }: InfoTileProps) {
  return (
    <div className={'at-info ' + className} style={style}>
      <div className="at-info__label">{label}</div>
      <div className="at-info__value">{value}</div>
    </div>
  );
}
