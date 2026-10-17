'use client';

import React from 'react';

/** Month grid (Mon-first) with dot markers, coloured shift cells and an ink selected day. */
export interface CalendarProps {
  year: number;
  /** 0–11 */
  month: number;
  /** Selected day of month */
  selected?: number;
  onSelect?: (day: number) => void;
  /** day → true (cyan dot) or a CSS colour */
  markers?: Record<number, boolean | string>;
  /** day → cell fill: cyan (morning shift) · lime (day shift) · ring (outlined, e.g. requested swap) */
  cells?: Record<number, 'cyan' | 'lime' | 'ring'>;
  /** Show trailing days of previous month (muted) */
  outside?: boolean;
  weekdays?: string[];
  cellHeight?: number;
  gap?: number;
  className?: string;
  style?: React.CSSProperties;
}

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function Calendar({ year, month, selected, onSelect, markers = {}, cells = {}, outside = true, weekdays = DOW, cellHeight = 44, gap = 6, className = '', style }: CalendarProps) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const dim = new Date(year, month + 1, 0).getDate();
  const prevDim = new Date(year, month, 0).getDate();
  const items: { d: number; out?: boolean }[] = [];
  for (let i = 0; i < lead; i++) items.push({ d: prevDim - lead + 1 + i, out: true });
  for (let d = 1; d <= dim; d++) items.push({ d });
  return (
    <div className={'at-cal ' + className} style={Object.assign({ '--cal-h': cellHeight + 'px', '--cal-gap': gap + 'px' }, style)}>
      <div className="at-cal__grid">{weekdays.map((w, i) => <div key={i} className="at-cal__dow">{w}</div>)}</div>
      <div className="at-cal__grid">
        {items.map((it, i) => {
          if (it.out) return outside ? <div key={'o' + i} className="at-cal__day at-cal__day--muted" style={{ cursor: 'default' }}>{it.d}</div> : <div key={'o' + i} />;
          const wd = (lead + it.d - 1) % 7;
          const cell = cells[it.d];
          const cls = ['at-cal__day', wd >= 5 && !cell ? 'at-cal__day--weekend' : '', cell ? 'at-cal__day--' + cell : '', selected === it.d ? 'at-cal__day--sel' : ''].filter(Boolean).join(' ');
          return (
            <button key={it.d} type="button" className={cls} onClick={() => onSelect && onSelect(it.d)}>
              {it.d}
              {markers[it.d] ? <span className="at-cal__mark" style={typeof markers[it.d] === 'string' ? { background: markers[it.d] as string } : undefined} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
