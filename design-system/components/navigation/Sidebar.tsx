'use client';

import React from 'react';
import { Icon } from '../icons/Icon';
import { IconButton } from '../actions/IconButton';
import { Avatar } from '../display/Avatar';
import { SearchInput } from '../forms/SearchInput';
import { Brand } from './Brand';

export interface SidebarLink {
  id: string;
  label: string;
  icon?: string;
  count?: number | string;
  /** Render as a link (with `linkAs`) instead of a button */
  href?: string;
}
export interface SidebarGroup { id?: string; label: string; items: SidebarLink[]; defaultOpen?: boolean }

/**
 * Frosted-glass app sidebar: brand, search, 2×2 quick-access tiles, collapsible uppercase groups, bell/logout tiles, ink user card.
 */
export interface SidebarProps {
  /** Replace the default <Brand /> */
  brand?: React.ReactNode;
  search?: boolean;
  searchPlaceholder?: string;
  quickLabel?: string;
  /** 2–4 role-specific shortcuts shown as tiles */
  quick?: Array<{ id: string; label: string; icon: string; href?: string }>;
  groups?: SidebarGroup[];
  /** id of the current page (tile or item) */
  active?: string;
  onNavigate?: (id: string) => void;
  /** Component used for items with `href` (e.g. next/link). Defaults to <a>. */
  linkAs?: React.ElementType;
  /** Called on hover/focus of an item with its id (route prefetch) */
  onPrefetch?: (id: string) => void;
  user?: { initials: string; name: string; role: string; onClick?: () => void };
  /** Show red dot on the bell */
  notifications?: boolean;
  onNotifications?: () => void;
  onLogout?: () => void;
  /** Replaces the default bell/logout tiles */
  footer?: React.ReactNode;
  /** Icon-only rail (84px) */
  collapsed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** Link-or-button target shared by NavItem and QuickTile. */
interface ItemTarget { href?: string; linkAs?: React.ElementType; onPrefetch?: () => void }

export interface NavItemProps extends ItemTarget { icon?: string; label: string; active?: boolean; count?: number | string; onClick?: () => void }
export interface NavGroupProps { label: string; defaultOpen?: boolean; children?: React.ReactNode }
export interface QuickTileProps extends ItemTarget { icon: string; label: string; active?: boolean; onClick?: () => void }
export interface UserCardProps { initials: string; name: string; role: string; onClick?: () => void }

function ItemShell({ href, linkAs, onPrefetch, onClick, className, active, label, children }: ItemTarget & {
  onClick?: () => void; className: string; active: boolean; label: string; children: React.ReactNode;
}) {
  const common = {
    className,
    'aria-current': active ? ('page' as const) : undefined,
    title: label,
    onMouseEnter: onPrefetch,
    onFocus: onPrefetch,
  };
  if (href) {
    const Link = linkAs || 'a';
    return <Link href={href} onClick={onClick} {...common}>{children}</Link>;
  }
  return <button type="button" onClick={onClick} {...common}>{children}</button>;
}

export function NavItem({ icon, label, active = false, count, onClick, href, linkAs, onPrefetch }: NavItemProps) {
  return (
    <ItemShell className="at-nav" active={active} label={label} onClick={onClick} href={href} linkAs={linkAs} onPrefetch={onPrefetch}>
      {icon ? <Icon name={icon} size={16} /> : null}
      <span className="at-nav__text">{label}</span>
      {count != null ? <span className="at-nav__count">{count}</span> : null}
    </ItemShell>
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

export function QuickTile({ icon, label, active = false, onClick, href, linkAs, onPrefetch }: QuickTileProps) {
  return (
    <ItemShell className="at-quick" active={active} label={label} onClick={onClick} href={href} linkAs={linkAs} onPrefetch={onPrefetch}>
      <Icon name={icon} size={18} />
      <span className="at-quick__label">{label}</span>
    </ItemShell>
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

export function Sidebar({ brand, search = true, searchPlaceholder, quickLabel = 'Quick access', quick = [], groups = [], active, onNavigate, linkAs, onPrefetch, user, notifications = false, onNotifications, onLogout, footer, collapsed = false, className = '', style }: SidebarProps) {
  const go = (id: string) => () => onNavigate && onNavigate(id);
  const pre = (id: string) => (onPrefetch ? () => onPrefetch(id) : undefined);
  return (
    <aside className={'at-side ' + (collapsed ? 'at-side--collapsed ' : '') + className} style={style}>
      <div className="at-side__head">{brand || <Brand />}</div>
      <div className="at-side__scroll">
        {search ? <SearchInput variant="bare" placeholder={searchPlaceholder} /> : null}
        {quick.length ? (
          <>
            <div className="at-side__label">{quickLabel}</div>
            <div className="at-side__quick">
              {quick.map((q) => <QuickTile key={q.id} icon={q.icon} label={q.label} active={active === q.id} onClick={go(q.id)} href={q.href} linkAs={linkAs} onPrefetch={pre(q.id)} />)}
            </div>
          </>
        ) : null}
        {groups.map((g) => (
          <NavGroup key={g.id || g.label} label={g.label} defaultOpen={g.defaultOpen !== false}>
            {(g.items || []).map((it) => <NavItem key={it.id} icon={it.icon} label={it.label} count={it.count} active={active === it.id} onClick={go(it.id)} href={it.href} linkAs={linkAs} onPrefetch={pre(it.id)} />)}
          </NavGroup>
        ))}
      </div>
      <div className="at-side__foot">
        <div className="at-side__tools">
          {footer ?? (
            <>
              <IconButton variant="tile" icon="bell" label="Notifications" dot={notifications} onClick={onNotifications} />
              <IconButton variant="tile" icon="log-out" label="Log out" onClick={onLogout} />
            </>
          )}
        </div>
        {user ? <UserCard initials={user.initials} name={user.name} role={user.role} onClick={user.onClick} /> : null}
      </div>
    </aside>
  );
}
