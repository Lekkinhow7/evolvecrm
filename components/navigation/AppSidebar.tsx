'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, BrandMark, Icon } from '@/design-system';
import { CRM_NAME, CRM_TAGLINE } from '@/lib/brand';
import { prefetchRoute } from '@/lib/prefetch';
import { SHELL_NAV, SIDEBAR_GROUPS, formatBadge, getActiveNavId } from './shellNav';
import type { ShellNavId } from './shellNav';
import type { NextAppointment } from './nextAppointment';
import { NewMenu } from './NewMenu';

export interface SidebarProfile {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  role?: string | null;
}

/** Situação do WhatsApp mostrada no rodapé do menu. `undefined` esconde o aviso (sem canal de WhatsApp). */
export type WhatsAppStatus = 'connected' | 'disconnected' | undefined;

/**
 * Nome e iniciais do cartão do usuário.
 * Nome: apelido → nome e sobrenome → primeiro nome → parte do e-mail → "Usuário".
 * Iniciais: nome + sobrenome quando existem; senão, as duas primeiras letras do nome exibido.
 */
export function getUserIdentity(profile: SidebarProfile | null | undefined): { name: string; initials: string } {
  const emailUser = profile?.email?.split('@')[0];
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
  const name = profile?.nickname || fullName || emailUser || 'Usuário';
  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : name.substring(0, 2);
  return { name, initials: initials.toUpperCase() };
}

const ROLE_LABEL: Record<string, string> = { admin: 'Administrador', vendedor: 'Vendedor' };

export interface AppSidebarProps {
  collapsed: boolean;
  unreadCount: number;
  whatsapp?: WhatsAppStatus;
  /** Próximo compromisso (reunião ou ligação). `null` mostra o cartão vazio; `undefined` esconde (carregando). */
  nextAppointment?: NextAppointment | null;
  profile: SidebarProfile | null | undefined;
  onSignOut: () => void;
}

const iconButton =
  'grid place-items-center size-9 shrink-0 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]';

/** Menu lateral do CRM: grupos com nome, contador de conversas, aviso do WhatsApp e cartão do usuário com Configurações e Sair. Recolher fica no topo. */
export function AppSidebar({ collapsed, unreadCount, whatsapp, nextAppointment, profile, onSignOut }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const active = getActiveNavId(pathname);
  const { name, initials } = getUserIdentity(profile);
  const role = (profile?.role && ROLE_LABEL[profile.role]) || profile?.email || '';
  const counts: Partial<Record<ShellNavId, string | undefined>> = { messaging: formatBadge(unreadCount) };

  const prefetch = (id: ShellNavId) => {
    const route = SHELL_NAV[id].prefetch;
    if (route) prefetchRoute(route);
  };

  return (
    <div
      className="flex h-full flex-col border-r border-[var(--border-hairline)] bg-[var(--surface-card)] px-3 pb-3 pt-5 transition-[width] duration-200 motion-reduce:transition-none"
      style={{ width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
    >
      {/* Marca (o botão de recolher fica no topo, ao lado do caminho da tela) */}
      <div className={`flex items-center gap-3 px-1.5 pb-4 ${collapsed ? 'justify-center' : ''}`}>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-ink)] text-[var(--text-inverse)]">
          <BrandMark height={22} title={CRM_NAME} color="var(--white)" />
        </span>
        {collapsed ? null : (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[length:var(--fs-body)] font-semibold leading-tight text-[var(--text-primary)]">{CRM_NAME}</div>
            {CRM_TAGLINE ? <div className="truncate text-[length:var(--fs-caption)] text-[var(--text-secondary)]">{CRM_TAGLINE}</div> : null}
          </div>
        )}
      </div>

      {/* Atalho de criação */}
      <div className="px-1 pb-1">
        <NewMenu collapsed={collapsed} />
      </div>

      {/* Grupos */}
      <nav aria-label="Menu principal" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            {collapsed ? (
              <div className="mx-auto my-2 h-px w-10 bg-[var(--border-default)]" aria-hidden="true" />
            ) : (
              <div className="px-3 pb-1.5 pt-3.5 text-[length:var(--fs-caption)] text-[var(--text-tertiary)]">{group.label}</div>
            )}
            {group.items.map((id) => {
              const item = SHELL_NAV[id];
              const isActive = active === id;
              const count = counts[id];
              return (
                <Link
                  key={id}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={collapsed ? (count ? `${item.label} (${count})` : item.label) : undefined}
                  title={collapsed ? item.label : undefined}
                  onMouseEnter={() => prefetch(id)}
                  onFocus={() => prefetch(id)}
                  className={`relative flex items-center gap-3 rounded-lg py-2 text-[length:var(--fs-body)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                    collapsed ? 'justify-center px-2' : 'px-3'
                  } ${
                    isActive
                      ? 'bg-[var(--surface-muted)] font-medium text-[var(--text-primary)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <Icon name={item.icon} size={20} className={isActive ? 'text-[var(--brand-cyan)]' : 'text-[var(--text-secondary)]'} />
                  {collapsed ? (
                    count ? <span className="absolute right-2 top-1.5 size-2 rounded-full bg-[var(--status-danger-solid)]" aria-hidden="true" /> : null
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {count ? (
                        <span className="rounded-full bg-[var(--status-danger-solid)] px-2 text-xs font-semibold leading-5 text-[var(--text-inverse)] tabular-nums">{count}</span>
                      ) : null}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Próximo compromisso */}
      {!collapsed && nextAppointment !== undefined ? (
        <section aria-label="Próximo compromisso" className="mt-3 flex flex-col gap-1.5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-sunken)] px-4 py-3.5">
          <div className="flex justify-between text-xs font-medium text-[var(--text-accent)]">
            <span>Próximo compromisso</span>
            {nextAppointment ? <span>{nextAppointment.day}</span> : null}
          </div>
          {nextAppointment ? (
            <>
              <div className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] proportional-nums">{nextAppointment.time}</div>
              <div className="line-clamp-2 text-sm font-medium text-[var(--text-primary)]">{nextAppointment.title}</div>
              {nextAppointment.dealTitle ? (
                <div className="flex items-center gap-1.5 truncate text-[length:var(--fs-caption)] text-[var(--text-secondary)]">
                  <Icon name="briefcase" size={14} />
                  <span className="truncate">{nextAppointment.dealTitle}</span>
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-sm text-[var(--text-secondary)]">Nenhuma reunião ou ligação marcada.</div>
          )}
          <Link
            href="/activities?view=calendar"
            className="mt-1.5 flex items-center justify-center gap-2 rounded-full bg-[var(--action-primary-bg)] py-2 text-sm font-medium text-[var(--action-primary-fg)] transition-colors hover:bg-[var(--action-primary-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <Icon name="calendar-days" size={16} />
            Abrir agenda
          </Link>
        </section>
      ) : null}

      {/* Aviso do WhatsApp */}
      {whatsapp ? (
        <div
          className={`mt-3 flex items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-sunken)] py-2 text-[length:var(--fs-caption)] text-[var(--text-secondary)] ${collapsed ? 'justify-center px-2' : 'px-3.5'}`}
          title={whatsapp === 'connected' ? 'WhatsApp conectado' : 'WhatsApp desconectado'}
        >
          <span
            className={`size-2 shrink-0 rounded-full ${whatsapp === 'connected' ? 'bg-[var(--status-success-solid)]' : 'bg-[var(--status-danger-solid)]'}`}
            aria-hidden="true"
          />
          {collapsed ? (
            <span className="sr-only">{whatsapp === 'connected' ? 'WhatsApp conectado' : 'WhatsApp desconectado'}</span>
          ) : (
            <>
              <span>WhatsApp</span>
              <span className="ml-auto">{whatsapp === 'connected' ? 'conectado' : 'desconectado'}</span>
            </>
          )}
        </div>
      ) : null}

      {/* Usuário, Configurações e Sair */}
      <div className={`mt-3 flex items-center gap-2.5 border-t border-[var(--border-hairline)] pt-3 ${collapsed ? 'flex-col' : 'px-1'}`}>
        <button
          type="button"
          onClick={() => router.push('/profile')}
          aria-label={`${name}, abrir perfil`}
          title={collapsed ? name : undefined}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          <Avatar initials={initials} size={38} src={profile?.avatar_url || undefined} />
          {collapsed ? null : (
            <span className="min-w-0">
              <span className="block truncate text-[length:var(--fs-body)] font-semibold leading-tight text-[var(--text-primary)]">{name}</span>
              <span className="block truncate text-[length:var(--fs-caption)] text-[var(--text-secondary)]">{role}</span>
            </span>
          )}
        </button>
        {collapsed ? null : (
          <Link href="/settings" className={iconButton} aria-label="Configurações" title="Configurações" onMouseEnter={() => prefetch('settings')}>
            <Icon name="settings" size={18} />
          </Link>
        )}
        <button type="button" className={iconButton} onClick={onSignOut} aria-label="Sair" title="Sair">
          <Icon name="log-out" size={18} />
        </button>
      </div>
    </div>
  );
}
