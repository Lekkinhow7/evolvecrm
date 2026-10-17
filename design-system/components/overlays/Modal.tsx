'use client';

import React from 'react';
import { IconButton } from '../actions/IconButton';

/**
 * Focused dialog — soft cyan header with optional 3D illustration, sectioned body, right-aligned actions.
 * Becomes a bottom sheet under 640px.
 */
export interface ModalProps {
  open?: boolean;
  onClose?: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Image URL for the 3D glass illustration in the header */
  art?: string;
  /** Leading element, e.g. an ink date square */
  lead?: React.ReactNode;
  /** Usually [secondary Cancel][primary Save] */
  footer?: React.ReactNode;
  /** Max width px, default 600 */
  width?: number;
  /** White header (no gradient) */
  plain?: boolean;
  /** Render in place (no overlay) — for docs and cards */
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/** Bordered body section with an uppercase eyebrow (DOCUMENT, ATTACHMENTS). */
export interface ModalSectionProps { title?: React.ReactNode; className?: string; children?: React.ReactNode }

export function Modal({ open = true, onClose, title, subtitle, art, lead, footer, width = 600, plain = false, inline = false, className = '', children }: ModalProps) {
  React.useEffect(() => {
    if (!open || inline || !onClose) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, inline, onClose]);
  if (!open) return null;
  return (
    <div className={'at-modal-layer ' + (inline ? 'at-modal-layer--inline' : '')} onMouseDown={(e) => { if (!inline && e.target === e.currentTarget && onClose) onClose(); }}>
      <div className={'at-modal ' + (plain ? 'at-modal--plain ' : '') + className} role="dialog" aria-modal={!inline} aria-label={typeof title === 'string' ? title : undefined} style={{ '--modal-w': width + 'px' } as React.CSSProperties}>
        <div className="at-modal__head">
          {lead ? <div className="at-modal__lead">{lead}</div> : null}
          <div className="at-modal__titles">
            <h2 className="at-modal__title">{title}</h2>
            {subtitle ? <p className="at-modal__sub">{subtitle}</p> : null}
          </div>
          {art ? <img className="at-modal__art" src={art} alt="" /> : null}
          {onClose ? <IconButton className="at-modal__close" icon="x" label="Close" round onClick={onClose} /> : null}
        </div>
        <div className="at-modal__body">{children}</div>
        {footer ? <div className="at-modal__foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ModalSection({ title, children, className = '' }: ModalSectionProps) {
  return (
    <section className={'at-modal__section ' + className}>
      {title ? <div className="at-modal__eyebrow">{title}</div> : null}
      {children}
    </section>
  );
}
