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
import { plural } from './sidebarStats';
import type { ActivityStats } from './sidebarStats';

export interface SidebarProfile {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  role?: string | null;
}

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
  /** Números das Tarefas (hoje e atrasadas). Sem eles, os avisos e o resumo de hoje somem. */
  activityStats?: ActivityStats;
  /** Negócios abertos parados há mais de 10 dias. */
  stalledDeals?: number;
  /** Funis do Kanban; com mais de um, aparecem como atalhos embaixo de Kanban. */
  funnels?: { id: string; name: string }[];
  /** Próximo compromisso (reunião ou ligação). `null` mostra o cartão vazio; `undefined` esconde (carregando). */
  nextAppointment?: NextAppointment | null;
  profile: SidebarProfile | null | undefined;
  onSignOut: () => void;
}

type BadgeTone = 'danger' | 'warning' | 'info' | 'neutral';
interface NavBadge { text: string; tone: BadgeTone; hint: string }

const BADGE_CLASS: Record<BadgeTone, string> = {
  danger: 'bg-[var(--status-danger-solid)] text-[var(--text-inverse)]',
  warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]',
  info: 'bg-[var(--status-info-bg)] text-[var(--status-info-fg)]',
  neutral: 'bg-[var(--surface-muted)] text-[var(--text-secondary)]',
};
const DOT_CLASS: Partial<Record<BadgeTone, string>> = {
  danger: 'bg-[var(--status-danger-solid)]',
  warning: 'bg-[var(--status-warning-solid)]',
};

function badge(count: number | undefined, tone: BadgeTone, hint: (n: number) => string, suffix = ''): NavBadge | undefined {
  const text = formatBadge(count);
  return text && count ? { text: text + suffix, tone, hint: hint(count) } : undefined;
}

/** Menu lateral do CRM: botão Novo, grupos com avisos, funis do Kanban, próximo compromisso, resumo de hoje e cartão do usuário com Sair. Recolher fica no topo. */
export function AppSidebar({ collapsed, unreadCount, activityStats, stalledDeals, funnels = [], nextAppointment, profile, onSignOut }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const active = getActiveNavId(pathname);
  const { name, initials } = getUserIdentity(profile);
  const role = (profile?.role && ROLE_LABEL[profile.role]) || profile?.email || '';
  const todayTotal = activityStats?.todayTotal;
  const badges: Partial<Record<ShellNavId, NavBadge>> = {
    inbox: badge(todayTotal, 'neutral', (n) => `${plural(n, 'pendência', 'pendências')} para hoje`),
    agenda: badge(activityStats?.todayAppointments, 'info', (n) => `${plural(n, 'compromisso', 'compromissos')} hoje`, ' hoje'),
    messaging: badge(unreadCount, 'danger', (n) => plural(n, 'conversa não lida', 'conversas não lidas')),
    activities: badge(activityStats?.overdue, 'danger', (n) => plural(n, 'tarefa atrasada', 'tarefas atrasadas')),
    boards: badge(stalledDeals, 'warning', (n) => `${plural(n, 'negócio parado', 'negócios parados')} há mais de 10 dias`),
  };
  const showFunnels = !collapsed && funnels.length > 1;

  const prefetch = (id: ShellNavId) => {
    const route = SHELL_NAV[id].prefetch;
    if (route) prefetchRoute(route);
  };

  return (
    <div
      className="flex h-full flex-col border-r border-[var(--border-hairline)] bg-[var(--surface-card)] px-3 pb-2.5 pt-3.5 transition-[width] duration-200 motion-reduce:transition-none"
      style={{ width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
    >
      {/* Marca (o botão de recolher fica no topo, ao lado do caminho da tela) */}
      <div className={`flex items-center gap-3 px-1.5 pb-2.5 ${collapsed ? 'justify-center' : ''}`}>
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

      {/* Menu e resumo de hoje rolam juntos (só em tela baixa); o cartão do usuário fica sempre visível. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-color:var(--border-default)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]">
          {/* Grupos */}
          <nav aria-label="Menu principal" className="flex flex-col">
            {SIDEBAR_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-0.5">
                {collapsed ? (
                  <div className="mx-auto my-2 h-px w-10 bg-[var(--border-default)]" aria-hidden="true" />
                ) : (
                  <div className="px-3 pb-0.5 pt-1 text-[length:var(--fs-caption)] text-[var(--text-tertiary)]">{group.label}</div>
                )}
                {group.items.map((id) => {
                  const item = SHELL_NAV[id];
                  const isActive = active === id;
                  const count = badges[id];
                  return (
                    <React.Fragment key={id}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={count ? `${item.label}, ${count.hint}` : collapsed ? item.label : undefined}
                      title={collapsed ? item.label : undefined}
                      onMouseEnter={() => prefetch(id)}
                      onFocus={() => prefetch(id)}
                      className={`relative flex items-center gap-3 rounded-lg py-1.5 text-[length:var(--fs-body)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                        collapsed ? 'justify-center px-2' : 'px-3'
                      } ${
                        isActive
                          ? 'bg-[var(--surface-muted)] font-medium text-[var(--text-primary)]'
                          : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <Icon name={item.icon} size={20} className={isActive ? 'text-[var(--brand-cyan)]' : 'text-[var(--text-secondary)]'} />
                      {collapsed ? (
                        count && DOT_CLASS[count.tone] ? <span className={`absolute right-2 top-1.5 size-2 rounded-full ${DOT_CLASS[count.tone]}`} aria-hidden="true" /> : null
                      ) : (
                        <>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {count ? (
                            <span title={count.hint} className={`rounded-full px-2 text-xs font-semibold leading-5 tabular-nums ${BADGE_CLASS[count.tone]}`}>{count.text}</span>
                          ) : null}
                        </>
                      )}
                    </Link>
                    {id === 'boards' && showFunnels ? (
                      <ul aria-label="Funis" className="mb-1 ml-[1.375rem] flex flex-col gap-0.5 border-l border-[var(--border-default)] pl-3">
                        {funnels.map((f) => (
                          <li key={f.id}>
                            <Link
                              href={`/boards?funil=${encodeURIComponent(f.id)}`}
                              className="block truncate rounded-md px-2 py-1 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                            >
                              {f.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    </React.Fragment>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Próximo compromisso, logo abaixo de Configurações: quadradinho com a data, dia e hora em destaque,
              tipo e cliente embaixo. Em tela baixa (menos de 750px) some, para o menu não ganhar barra de rolagem;
              a Agenda e o resumo de hoje seguem visíveis. */}
          {!collapsed && nextAppointment !== undefined ? (
            <Link
              href="/agenda"
              aria-label={nextAppointment ? `Próximo compromisso, ${nextAppointment.day} às ${nextAppointment.time}: ${nextAppointment.title}` : 'Próximo compromisso: nenhuma reunião ou ligação marcada'}
              className="mt-1.5 hidden items-center gap-3 rounded-2xl border border-[var(--border-accent)] bg-[linear-gradient(135deg,var(--surface-accent)_0%,var(--surface-sunken)_80%)] py-2 pl-2 pr-3 transition-colors hover:border-[var(--border-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] [@media(min-height:750px)]:flex"
            >
              <span className="flex h-[46px] w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]">
                {nextAppointment ? (
                  <>
                    <span className="text-[10px] font-semibold tracking-[0.08em] text-[var(--text-accent)]">{nextAppointment.month}</span>
                    <span className="text-[19px] font-semibold leading-[1.1] text-[var(--text-primary)] proportional-nums">{nextAppointment.dayOfMonth}</span>
                  </>
                ) : (
                  <Icon name="calendar-check" size={18} className="text-[var(--text-accent)]" />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="truncate text-[11px] leading-[14px] text-[var(--text-tertiary)]">Próximo compromisso</span>
                <span className="truncate text-[14.5px] font-semibold leading-[19px] tracking-[-0.01em] text-[var(--text-primary)]">
                  {nextAppointment ? `${nextAppointment.when}, ${nextAppointment.time}` : 'Agenda livre'}
                </span>
                <span className="truncate text-xs leading-4 text-[var(--text-secondary)]">
                  {nextAppointment ? nextAppointment.title : 'Nenhuma reunião marcada'}
                </span>
              </span>
            </Link>
          ) : null}

          {/* Resumo de hoje fica embaixo; em tela baixa, rola junto com o menu. */}
          <div className="flex-1" aria-hidden="true" />
          {/* Resumo de hoje: três botões separados, cada um leva à lista certa */}
          {!collapsed && activityStats ? (
            <section aria-label="Hoje" className="mt-1.5 flex flex-col gap-1">
              <div className="px-1 text-[length:var(--fs-caption)] text-[var(--text-tertiary)]">Hoje</div>
              <div className="flex flex-col gap-1">
                {[
                  { n: activityStats.todayAppointments, label: 'Reuniões', a11y: activityStats.todayAppointments === 1 ? 'reunião hoje' : 'reuniões hoje', icon: 'calendar-days', href: '/agenda', alert: false },
                  { n: activityStats.todayTasks, label: 'Tarefas', a11y: activityStats.todayTasks === 1 ? 'tarefa hoje' : 'tarefas hoje', icon: 'list-checks', href: '/activities?filter=today&tipo=TASK', alert: false },
                  { n: activityStats.overdue, label: 'Atrasadas', a11y: activityStats.overdue === 1 ? 'atrasada' : 'atrasadas', icon: 'alarm-clock', href: '/activities?filter=overdue', alert: activityStats.overdue > 0 },
                ].map((t) => (
                  <Link
                    key={t.label}
                    href={t.href}
                    aria-label={`${t.n} ${t.a11y}`}
                    className={`flex items-center gap-2.5 rounded-xl border py-0.5 pl-1.5 pr-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
                      t.alert
                        ? 'border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] hover:border-[var(--status-danger-fg)]'
                        : 'border-[var(--border-hairline)] bg-[var(--surface-sunken)] text-[var(--text-primary)] hover:border-[var(--border-default)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <span className={`grid size-6 shrink-0 place-items-center rounded-md ${t.alert ? 'bg-[var(--surface-card)]' : 'bg-[var(--surface-accent)] text-[var(--text-accent)]'}`}>
                      <Icon name={t.icon} size={14} />
                    </span>
                    <span className="flex-1">{t.label}</span>
                    <span
                      className={`grid h-5 min-w-6 place-items-center rounded-full px-2 text-xs font-semibold ${
                        t.alert
                          ? 'bg-[var(--status-danger-solid)] text-[var(--text-inverse)]'
                          : 'border border-[var(--border-hairline)] bg-[var(--surface-card)] text-[var(--text-primary)]'
                      }`}
                    >
                      {t.n}
                    </span>
                    <Icon name="chevron-right" size={14} className="text-[var(--text-quiet)]" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

      </div>

      {/* Usuário e Sair */}
      <div className={`mt-2 flex items-center gap-2 border-t border-[var(--border-hairline)] pt-2.5 ${collapsed ? 'flex-col' : 'pl-1.5'}`}>
        <button
          type="button"
          onClick={() => router.push('/profile')}
          aria-label={`${name}, abrir perfil`}
          title={collapsed ? name : undefined}
          className="flex min-w-0 flex-1 items-center gap-4 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          <Avatar initials={initials} size={38} src={profile?.avatar_url || undefined} />
          {collapsed ? null : (
            <span className="min-w-0">
              <span className="block truncate text-[length:var(--fs-body)] font-semibold leading-tight text-[var(--text-primary)]">{name}</span>
              <span className="block truncate text-[length:var(--fs-caption)] text-[var(--text-secondary)]">{role}</span>
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sair"
          title="Sair"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-[var(--text-quiet)] transition-colors hover:bg-[var(--status-danger-bg)] hover:text-[var(--status-danger-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          <Icon name="log-out" size={18} />
        </button>
      </div>
    </div>
  );
}
