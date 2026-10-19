'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/design-system';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Atalhos de criação. Cada link abre a tela com o cadastro já aberto (`?novo=`). */
export const NEW_ITEMS = [
  { label: 'Novo contato', hint: 'Cadastrar cliente ou lead', icon: 'user-plus', href: '/contacts?novo=1' },
  { label: 'Novo negócio', hint: 'Abrir oportunidade no Kanban', icon: 'briefcase', href: '/boards?novo=1' },
  { label: 'Nova reunião', hint: 'Marcar horário com cliente', icon: 'calendar-plus', href: '/agenda?novo=reuniao' },
  { label: 'Nova tarefa', hint: 'Lembrete para a equipe', icon: 'list-plus', href: '/activities?novo=tarefa' },
] as const;

/** Botão "Novo" do menu lateral: abre a lista do que dá para criar. */
export function NewMenu({ collapsed }: { collapsed: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={collapsed ? 'Novo' : undefined}
          title={collapsed ? 'Novo' : undefined}
          className={`group flex items-center gap-3 rounded-xl border border-[var(--border-accent)] bg-[var(--surface-accent)] text-[length:var(--fs-body)] font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-accent-strong)] hover:bg-[var(--surface-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] data-[state=open]:border-[var(--border-accent-strong)] data-[state=open]:bg-[var(--surface-accent-hover)] ${
            collapsed ? 'mx-auto size-11 justify-center p-0' : 'w-full py-2 pl-2 pr-3'
          }`}
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--action-primary-bg)] text-[var(--action-primary-fg)]">
            <Icon name="plus" size={16} />
          </span>
          {collapsed ? null : (
            <>
              <span className="flex-1 text-left">Novo</span>
              <Icon name="chevron-down" size={16} className="text-[var(--text-secondary)] transition-transform group-data-[state=open]:rotate-180" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={collapsed ? 'right' : 'bottom'}
        align="start"
        sideOffset={8}
        className="w-64 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-card)] p-1.5 shadow-lg"
      >
        {NEW_ITEMS.map((item) => (
          <DropdownMenuItem key={item.href} asChild className="cursor-pointer rounded-xl p-2 focus:bg-[var(--surface-hover)]">
            <Link href={item.href} className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--surface-muted)] text-[var(--text-accent)]">
                <Icon name={item.icon} size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-[var(--text-primary)]">{item.label}</span>
                <span className="block truncate text-xs text-[var(--text-secondary)]">{item.hint}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
