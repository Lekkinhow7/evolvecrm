import { describe, expect, it } from 'vitest';
import { SHELL_NAV, SIDEBAR_GROUPS, SIDEBAR_QUICK, formatBadge, getActiveNavId, getBreadcrumbs } from './shellNav';

describe('getActiveNavId', () => {
  it('marca Negócios em /pipeline e em subrotas de /boards', () => {
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
    expect(getBreadcrumbs('/contacts')).toEqual([{ label: 'Relacionamento' }, { label: 'Contatos' }]);
    expect(getBreadcrumbs('/pipeline')).toEqual([{ label: 'Comercial' }, { label: 'Negócios' }]);
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
  it('acesso rápido e grupos cobrem os 8 itens do menu, sem perfil', () => {
    const ids = [...SIDEBAR_QUICK, ...SIDEBAR_GROUPS.flatMap((g) => g.items)];
    for (const id of ids) expect(SHELL_NAV[id]).toBeDefined();
    expect(new Set(ids)).toEqual(new Set(['inbox', 'messaging', 'dashboard', 'boards', 'contacts', 'activities', 'reports', 'settings']));
  });
});
