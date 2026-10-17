'use client';

import React from 'react';
import { Badge } from '../display/Badge';

type Tone = 'info' | 'success' | 'warning' | 'danger' | 'active' | 'neutral';
/** Timed agenda row: time · coloured status bar · title/sub · status badge. */
export interface ScheduleItemProps {
  /** "09:00" */
  time?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Drives the bar colour (and badge tone unless badgeTone set) */
  tone?: Tone;
  /** Override bar colour */
  bar?: string;
  badge?: React.ReactNode;
  badgeTone?: Tone;
  onClick?: () => void;
  className?: string;
}

/** Small kanban card with a left status bar (Task flow board). */
export interface TaskCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tone?: Tone;
  onClick?: () => void;
  className?: string;
}

const BAR = { info: 'var(--cyan-500)', success: 'var(--lime-500)', warning: 'var(--amber-500)', danger: 'var(--red-500)', active: 'var(--cyan-500)', neutral: 'var(--slate-300)' };

export function ScheduleItem({ time, title, subtitle, tone = 'info', bar, badge, badgeTone, onClick, className = '' }: ScheduleItemProps) {
  return (
    <div className={'at-sched ' + className} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      {time ? <span className="at-sched__time">{time}</span> : null}
      <span className="at-sched__bar" style={{ background: bar || BAR[tone] }} />
      <div className="at-sched__body">
        <div className="at-sched__title">{title}</div>
        {subtitle ? <div className="at-sched__sub">{subtitle}</div> : null}
      </div>
      {badge ? <Badge tone={badgeTone || tone}>{badge}</Badge> : null}
    </div>
  );
}

export function TaskCard({ title, subtitle, tone = 'info', className = '', onClick }: TaskCardProps) {
  return (
    <div className={'at-taskcard ' + className} style={{ '--bar': BAR[tone], cursor: onClick ? 'pointer' : undefined } as React.CSSProperties} onClick={onClick}>
      <div className="at-taskcard__title">{title}</div>
      {subtitle ? <div className="at-taskcard__sub">{subtitle}</div> : null}
    </div>
  );
}
