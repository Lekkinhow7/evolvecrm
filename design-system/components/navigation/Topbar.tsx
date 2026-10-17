'use client';

import React from 'react';
import { Icon } from '../icons/Icon';
import { IconButton } from '../actions/IconButton';
import { Segmented } from '../forms/Segmented';

/** Page chrome row: collapse button, breadcrumbs, language toggle, theme toggle, organisation selector. */
export interface Crumb { id?: string; label: string }
export interface TopbarProps {
  crumbs?: Crumb[];
  onNavigate?: (id: string) => void;
  /** Shows the « / » button when provided */
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  /** Language codes; default ['PT','EN'] (source used RU/EN). Pass [] to hide. */
  langs?: string[];
  lang?: string;
  onLang?: (code: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  /** Organisation / site name, e.g. "Farmavex JSC, Dubna plant" — hidden under 640px */
  org?: string;
  onOrg?: () => void;
  /** Extra controls before the language toggle */
  right?: React.ReactNode;
  className?: string;
}

export interface BreadcrumbsProps { items: Crumb[]; onNavigate?: (id: string) => void }
export interface OrgSelectorProps { label: string; icon?: string; onClick?: () => void }

export function Breadcrumbs({ items = [], onNavigate }: BreadcrumbsProps) {
  return (
    <nav className="at-crumbs" aria-label="Breadcrumb">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 ? <span className="at-crumbs__sep">/</span> : null}
            <button type="button" className={'at-crumbs__item ' + (last ? 'at-crumbs__item--current' : '')} aria-current={last ? 'page' : undefined} onClick={!last && onNavigate ? () => onNavigate(it.id || it.label) : undefined}>{it.label}</button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export function OrgSelector({ label, icon = 'building-2', onClick }: OrgSelectorProps) {
  return (
    <button type="button" className="at-org" onClick={onClick}><Icon name={icon} size={16} /><span>{label}</span></button>
  );
}

export function Topbar({ crumbs = [], onNavigate, onToggleSidebar, sidebarCollapsed = false, langs = ['PT', 'EN'], lang, onLang, theme = 'light', onToggleTheme, org, onOrg, right, className = '' }: TopbarProps) {
  return (
    <div className={'at-top ' + className}>
      <div className="at-top__left">
        {onToggleSidebar ? <IconButton icon={sidebarCollapsed ? 'chevrons-right' : 'chevrons-left'} label={sidebarCollapsed ? 'Open menu' : 'Collapse menu'} onClick={onToggleSidebar} /> : null}
        <Breadcrumbs items={crumbs} onNavigate={onNavigate} />
      </div>
      <div className="at-top__right">
        {right}
        {langs && langs.length ? <Segmented options={langs} value={lang || langs[langs.length - 1]} onChange={onLang} /> : null}
        {onToggleTheme ? <IconButton icon={theme === 'dark' ? 'moon' : 'sun'} label="Switch theme" round onClick={onToggleTheme} /> : null}
        {org ? <OrgSelector label={org} onClick={onOrg} /> : null}
      </div>
    </div>
  );
}
