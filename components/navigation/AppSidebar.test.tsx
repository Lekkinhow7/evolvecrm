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

  it('marca Kanban como ativo em /pipeline', () => {
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'ana@x.com' }} onSignOut={() => {}} />);
    expect(screen.getByRole('link', { name: /Kanban/ }).getAttribute('aria-current')).toBe('page');
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
    expect(screen.getByText('Alex Santana')).toBeTruthy();
    expect(screen.getByText('AS')).toBeTruthy();
  });

  it('só com primeiro nome, as iniciais vêm do nome e não do e-mail', () => {
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'contato@x.com', first_name: 'Alex' }} onSignOut={() => {}} />);
    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('mostra a foto do perfil quando existe', () => {
    const { container } = render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'ana@x.com', avatar_url: 'https://x.com/a.png' }} onSignOut={() => {}} />);
    expect(container.querySelector('img[src="https://x.com/a.png"]')).toBeTruthy();
  });

  it('o cartão do usuário abre o perfil', () => {
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'ana@x.com' }} onSignOut={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'ana, abrir perfil' }));
    expect(push).toHaveBeenCalledWith('/profile');
  });

  it('Sair chama onSignOut', () => {
    const onSignOut = vi.fn();
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'ana@x.com' }} onSignOut={onSignOut} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(onSignOut).toHaveBeenCalled();
  });

  it('mostra o papel do usuário em português', () => {
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'a@x.com', first_name: 'Alex', role: 'admin' }} onSignOut={() => {}} />);
    expect(screen.getByText('Administrador')).toBeTruthy();
  });

  it('Configurações abre pelo botão do cartão do usuário', () => {
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'ana@x.com' }} onSignOut={() => {}} />);
    expect(screen.getByRole('link', { name: 'Configurações' }).getAttribute('href')).toBe('/settings');
  });

  it('recolhido, esconde os nomes mas mantém os links acessíveis e o Sair', () => {
    render(<AppSidebar collapsed unreadCount={5} profile={{ email: 'ana@x.com' }} onSignOut={() => {}} />);
    expect(screen.queryByText('Minha mesa')).toBeNull();
    expect(screen.getByRole('link', { name: 'Minha mesa' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Conversas (5)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeTruthy();
  });

  it('não mostra Assistente IA nem Sugestões da IA no menu', () => {
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'ana@x.com' }} onSignOut={() => {}} />);
    expect(screen.queryByText('Assistente IA')).toBeNull();
    expect(screen.queryByText('Sugestões da IA')).toBeNull();
  });

  it('mostra o próximo compromisso com link para o calendário', () => {
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'ana@x.com' }} onSignOut={() => {}}
      nextAppointment={{ day: 'hoje', time: '14:30', title: 'Reunião · Consulta', dealTitle: 'Contrato Marcos' }} />);
    expect(screen.getByText('14:30')).toBeTruthy();
    expect(screen.getByText('Reunião · Consulta')).toBeTruthy();
    expect(screen.getByText('Contrato Marcos')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Abrir agenda/ }).getAttribute('href')).toBe('/activities?view=calendar');
  });

  it('sem compromisso, o cartão avisa que não há nada marcado', () => {
    render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'ana@x.com' }} onSignOut={() => {}} nextAppointment={null} />);
    expect(screen.getByText('Nenhuma reunião ou ligação marcada.')).toBeTruthy();
  });

  it('esconde o cartão enquanto carrega e quando o menu está recolhido', () => {
    const appt = { day: 'hoje', time: '14:30', title: 'Reunião · Consulta' };
    const { rerender } = render(<AppSidebar collapsed={false} unreadCount={0} profile={{ email: 'ana@x.com' }} onSignOut={() => {}} />);
    expect(screen.queryByText('Próximo compromisso')).toBeNull();
    rerender(<AppSidebar collapsed unreadCount={0} profile={{ email: 'ana@x.com' }} onSignOut={() => {}} nextAppointment={appt} />);
    expect(screen.queryByText('Próximo compromisso')).toBeNull();
  });
});
