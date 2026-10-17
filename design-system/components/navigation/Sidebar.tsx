'use client';

import React from 'react';
import { Icon } from '../icons/Icon';
import { IconButton } from '../actions/IconButton';
import { Avatar } from '../display/Avatar';
import { SearchInput } from '../forms/SearchInput';
import { Brand } from './Brand';

export interface SidebarLink { id: string; label: string; icon?: string; count?: number }
export interface SidebarGroup { id?: string; label: string; items: SidebarLink[]; defaultOpen?: boolean }

/**
 * Frosted-glass app sidebar: brand, search, 2×2 quick-access tiles, collapsible uppercase groups, bell/logout tiles, ink user card.
 */
export interface SidebarProps {
  /** Replace the default <Brand /> */
  brand?: React.ReactNode;
  search?: boolean;
  quickLabel?: string;
  /** 2–4 role-specific shortcuts shown as tiles */
  quick?: Array<{ id: string; label: string; icon: string }>;
  groups?: SidebarGroup[];
  /** id of the current page (tile or item) */
  active?: string;
  onNavigate?: (id: string) => void;
  user?: { initials: string; name: string; role: string; onClick?: () => void };
  /** Show red dot on the bell */
  notifications?: boolean;
  onNotifications?: () => void;
  onLogout?: () => void;
  /** Icon-only rail (84px) */
  collapsed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface NavItemProps { icon?: string; label: string; active?: boolean; count?: number; onClick?: () => void }
export interface NavGroupProps { label: string; defaultOpen?: boolean; children?: React.ReactNode }
export interface QuickTileProps { icon: string; label: string; active?: boolean; onClick?: () => void }
export interface UserCardProps { initials: string; name: string; role: string; onClick?: () => void }

export function NavItem({ icon, label, active = false, count, onClick }: NavItemProps) {
  return (
    <button type="button" className="at-nav" aria-current={active ? 'page' : undefined} onClick={onClick} title={label}>
      {icon ? <Icon name={icon} size={16} /> : null}
      <span className="at-nav__text">{label}</span>
      {count != null ? <span className="at-nav__count">{count}</span> : null}
    </button>
  );
}

export function NavGroup({ label, defaultOpen = true, children }: NavGroupProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className={'at-group ' + (open ? '' : 'at-group--closed')}>
      <button type="button" className="at-group__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon name="chevron-down" size={14} /><span>{label}</span>
      </button>
      <div className="at-group__items">{children}</div>
    </div>
  );
}

export function QuickTile({ icon, label, active = false, onClick }: QuickTileProps) {
  return (
    <button type="button" className="at-quick" aria-current={active ? 'page' : undefined} onClick={onClick} title={label}>
      <Icon name={icon} size={18} />
      <span className="at-quick__label">{label}</span>
    </button>
  );
}

export function UserCard({ initials, name, role, onClick }: UserCardProps) {
  return (
    <button type="button" className="at-user" onClick={onClick}>
      <Avatar initials={initials} size={38} radius={11} />
      <span className="at-user__text"><div className="at-user__name">{name}</div><div className="at-user__role">{role}</div></span>
    </button>
  );
}

export function Sidebar({ brand, search = true, quickLabel = 'Quick access', quick = [], groups = [], active, onNavigate, user, notifications = false, onNotifications, onLogout, collapsed = false, className = '', style }: SidebarProps) {
  const go = (id) => () => onNavigate && onNavigate(id);
  return (
    <aside className={'at-side ' + (collapsed ? 'at-side--collapsed ' : '') + className} style={style}>
      <div className="at-side__head">{brand || <Brand />}</div>
      <div className="at-side__scroll">
        {search ? <SearchInput variant="bare" /> : null}
        {quick.length ? (
          <>
            <div className="at-side__label">{quickLabel}</div>
            <div className="at-side__quick">{quick.map((q) => <QuickTile key={q.id} icon={q.icon} label={q.label} active={active === q.id} onClick={go(q.id)} />)}</div>
          </>
        ) : null}
        {groups.map((g) => (
          <NavGroup key={g.id || g.label} label={g.label} defaultOpen={g.defaultOpen !== false}>
            {(g.items || []).map((it) => <NavItem key={it.id} icon={it.icon} label={it.label} count={it.count} active={active === it.id} onClick={go(it.id)} />)}
          </NavGroup>
        ))}
      </div>
      <div className="at-side__foot">
        <div className="at-side__tools">
          <IconButton variant="tile" icon="bell" label="Notifications" dot={notifications} onClick={onNotifications} />
          <IconButton variant="tile" icon="log-out" label="Log out" onClick={onLogout} />
        </div>
        {user ? <UserCard initials={user.initials} name={user.name} role={user.role} onClick={user.onClick} /> : null}
      </div>
    </aside>
  );
}
