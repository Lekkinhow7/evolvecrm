'use client';

import React from 'react';
import { Icon } from '../icons/Icon';

/** Labelled input with a soft sunken box (record forms, modals). */
export interface TextFieldProps {
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  /** Optional leading Lucide icon */
  icon?: string;
  hint?: string;
  /** Error message — turns border red */
  error?: string;
  readOnly?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function TextField({ label, value, defaultValue, onChange, placeholder, type = 'text', icon, hint, error, readOnly, disabled, id, className = '', ...rest }: TextFieldProps) {
  const fid = id || (label ? 'f-' + String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
  return (
    <div className={'at-field ' + (error ? 'at-field--error ' : '') + className}>
      {label ? <label className="at-field__label" htmlFor={fid}>{label}</label> : null}
      <div className="at-field__box">
        {icon ? <Icon name={icon} size={18} color="var(--text-secondary)" /> : null}
        <input id={fid} type={type} value={value} defaultValue={defaultValue} placeholder={placeholder} readOnly={readOnly} disabled={disabled} onChange={onChange ? (e) => onChange(e.target.value, e) : undefined} {...rest} />
      </div>
      {error || hint ? <div className="at-field__hint">{error || hint}</div> : null}
    </div>
  );
}
