'use client';

import React from 'react';

/** Week-strip shift card (Morning / Day / Day off) with day header. */
export interface ShiftCardProps {
  /** "Mon" */
  dayLabel?: string;
  dayNumber?: number | string;
  /** cyan (morning) · lime (day) · off (dashed, day off) */
  tone?: 'cyan' | 'lime' | 'off';
  name: React.ReactNode;
  /** "07:00–15:30" */
  time?: React.ReactNode;
  /** "Grade A/B · line 2" */
  zone?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ShiftCard({ dayLabel, dayNumber, tone = 'cyan', name, time, zone, className = '', style }: ShiftCardProps) {
  return (
    <div className={className} style={Object.assign({ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }, style)}>
      {dayLabel ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
          <span>{dayLabel}</span><span style={{ fontSize: 18, color: 'var(--text-primary)' }}>{dayNumber}</span>
        </div>
      ) : null}
      <div className={'at-shift at-shift--' + tone}>
        <div><div className="at-shift__name">{name}</div>{time ? <div className="at-shift__time">{time}</div> : null}</div>
        {zone ? <div className="at-shift__zone">{zone}</div> : null}
      </div>
    </div>
  );
}
