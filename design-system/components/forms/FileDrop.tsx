'use client';

import React from 'react';
import { Icon } from '../icons/Icon';

/** Dashed upload target for attachments. */
export interface FileDropProps {
  title?: string;
  hint?: string;
  onClick?: () => void;
  className?: string;
}

/** Attached file row (type tile + name + meta + text action). */
export interface FileItemProps {
  name: string;
  /** e.g. "2.4 MB · 14.02.2026" */
  meta?: string;
  /** Short type code shown in the tile. Default "PDF". */
  type?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function FileDrop({ title = 'Add a scan or PDF', hint = 'up to 10 MB, several files allowed', onClick, className = '' }: FileDropProps) {
  const [over, setOver] = React.useState(false);
  return (
    <button type="button" className={'at-drop ' + (over ? 'at-drop--over ' : '') + className} onClick={onClick}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); }}>
      <span className="at-drop__well"><Icon name="plus" size={20} /></span>
      <span><div className="at-drop__title">{title}</div><div className="at-drop__hint">{hint}</div></span>
    </button>
  );
}

export function FileItem({ name, meta, type = 'PDF', actionLabel = 'Open', onAction, className = '' }: FileItemProps) {
  return (
    <div className={'at-file ' + className}>
      <span className="at-file__type">{type}</span>
      <div style={{ minWidth: 0 }}><div className="at-file__name">{name}</div><div className="at-file__meta">{meta}</div></div>
      {actionLabel ? <button type="button" className="at-file__action" onClick={onAction}>{actionLabel}</button> : null}
    </div>
  );
}
