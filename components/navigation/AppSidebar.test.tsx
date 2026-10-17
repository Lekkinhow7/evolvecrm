import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const push = vi.fn();
let pathname = '/pipeline';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children?: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

import { AppSidebar } from './AppSidebar';

describe('AppSidebar', () => {
  beforeEach(() => {
    pathname = '/pipeline';
    push.mockClear();
  });

  it('marca Negócios como ativo em /pipeline', () => {
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'ana@x.com' }} onSignOut={() => {}} />);
    expect(screen.getByRole('link', { name: /Negócios/ }).getAttribute('aria-current')).toBe('page');
  });

  it('mostra 99+ quando há mais de 99 mensagens não lidas', () => {
    render(<AppSidebar collapsed={false} unreadCount={150} profile={{ email: 'ana@x.com' }} onSignOut={() => {}} />);
    expect(screen.getByText('99+')).toBeTruthy();
  });

  it('sem nome no perfil usa a parte do e-mail e as iniciais dele', () => {
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'ana@x.com' }} onSignOut={() => {}} />);
    expect(screen.getByText('ana')).toBeTruthy();
    expect(screen.getByText('AN')).toBeTruthy();
  });

  it('com nome e sobrenome usa as iniciais deles', () => {
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'a@x.com', first_name: 'Alex', last_name: 'Santana' }} onSignOut={() => {}} />);
    expect(screen.getByText('Alex')).toBeTruthy();
    expect(screen.getByText('AS')).toBeTruthy();
  });

  it('o cartão do usuário abre o perfil', () => {
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'ana@x.com' }} onSignOut={() => {}} />);
    fireEvent.click(screen.getByText('ana'));
    expect(push).toHaveBeenCalledWith('/profile');
  });

  it('Sair chama onSignOut', () => {
    const onSignOut = vi.fn();
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'ana@x.com' }} onSignOut={onSignOut} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(onSignOut).toHaveBeenCalled();
  });
});
