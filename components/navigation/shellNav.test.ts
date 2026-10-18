import { describe, expect, it } from 'vitest';
import { SHELL_NAV, SIDEBAR_GROUPS, formatBadge, getActiveNavId, getBreadcrumbs } from './shellNav';

describe('getActiveNavId', () => {
  it('marca Kanban em /pipeline e em subrotas de /boards', () => {
    expect(getActiveNavId('/pipeline')).toBe('boards');
    expect(getActiveNavId('/boards/abc')).toBe('boards');
  });
  it('casa subrotas pelo prefixo', () => {
    expect(getActiveNavId('/settings/ai')).toBe('settings');
    expect(getActiveNavId('/dashboard')).toBe('dashboard');
  });
  it('não marca nada fora do menu', () => {
    expect(getActiveNavId('/login')).toBeUndefined();
  });
});

describe('getBreadcrumbs', () => {
  it('monta grupo e tela', () => {
    expect(getBreadcrumbs('/contacts')).toEqual([{ label: 'Comercial' }, { label: 'Contatos' }]);
    expect(getBreadcrumbs('/pipeline')).toEqual([{ label: 'Comercial' }, { label: 'Kanban' }]);
    expect(getBreadcrumbs('/inbox')).toEqual([{ label: 'Dia a dia' }, { label: 'Minha mesa' }]);
    expect(getBreadcrumbs('/agenda')).toEqual([{ label: 'Dia a dia' }, { label: 'Agenda' }]);
    expect(getBreadcrumbs('/decisions')).toEqual([{ label: 'Inteligência' }, { label: 'Sugestões da IA' }]);
  });
  it('fica vazio em rota desconhecida', () => {
    expect(getBreadcrumbs('/desconhecida')).toEqual([]);
  });
});

describe('formatBadge', () => {
  it('esconde zero e indefinido', () => {
    expect(formatBadge(0)).toBeUndefined();
    expect(formatBadge(undefined)).toBeUndefined();
  });
  it('mostra o número até 99 e 99+ acima', () => {
    expect(formatBadge(7)).toBe('7');
    expect(formatBadge(99)).toBe('99');
    expect(formatBadge(100)).toBe('99+');
  });
});

describe('estrutura da sidebar', () => {
  it('os grupos seguem a ordem do menu; IA fica no topo e Configurações e Perfil no cartão do usuário', () => {
    expect(SIDEBAR_GROUPS.map((g) => g.label)).toEqual(['Dia a dia', 'Comercial', 'Conta']);
    const ids = SIDEBAR_GROUPS.flatMap((g) => g.items);
    for (const id of ids) expect(SHELL_NAV[id].group).toBe(SIDEBAR_GROUPS.find((g) => g.items.includes(id))?.label);
    expect(ids).toEqual(['inbox', 'agenda', 'messaging', 'activities', 'dashboard', 'boards', 'contacts', 'reports', 'settings']);
  });
});
