import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';

const LinkStub = ({ href, children, ...rest }: { href: string; children?: React.ReactNode }) => <a href={href} {...rest}>{children}</a>;

const groups = (items: { id: string; label: string; href?: string; count?: number | string }[]) => [{ label: 'Relacionamento', items }];

describe('Sidebar com links', () => {
  it('renderiza link com href e aria-current quando ativo', () => {
    render(<Sidebar search={false} linkAs={LinkStub} active="contacts" groups={groups([{ id: 'contacts', label: 'Contatos', href: '/contacts' }])} />);
    const link = screen.getByRole('link', { name: /Contatos/ });
    expect(link.getAttribute('href')).toBe('/contacts');
    expect(link.getAttribute('aria-current')).toBe('page');
  });

  it('quick tile com href também vira link', () => {
    render(<Sidebar search={false} linkAs={LinkStub} quick={[{ id: 'inbox', label: 'Inbox', icon: 'inbox', href: '/inbox' }]} />);
    expect(screen.getByRole('link', { name: /Inbox/ }).getAttribute('href')).toBe('/inbox');
  });

  it('sem href continua botão e chama onNavigate', () => {
    const onNavigate = vi.fn();
    render(<Sidebar search={false} onNavigate={onNavigate} groups={groups([{ id: 'contacts', label: 'Contatos' }])} />);
    fireEvent.click(screen.getByRole('button', { name: /Contatos/ }));
    expect(onNavigate).toHaveBeenCalledWith('contacts');
  });

  it('mostra contador em texto', () => {
    render(<Sidebar search={false} groups={groups([{ id: 'messaging', label: 'Mensagens', count: '99+' }])} />);
    expect(screen.getByText('99+')).toBeTruthy();
  });

  it('footer substitui os tiles padrão', () => {
    render(<Sidebar search={false} footer={<span>rodape</span>} />);
    expect(screen.getByText('rodape')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Notifications' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull();
  });

  it('chama onPrefetch ao passar o mouse', () => {
    const onPrefetch = vi.fn();
    render(<Sidebar search={false} linkAs={LinkStub} onPrefetch={onPrefetch} groups={groups([{ id: 'contacts', label: 'Contatos', href: '/contacts' }])} />);
    fireEvent.mouseEnter(screen.getByRole('link', { name: /Contatos/ }));
    expect(onPrefetch).toHaveBeenCalledWith('contacts');
  });

  it('usa searchPlaceholder', () => {
    render(<Sidebar searchPlaceholder="Buscar" />);
    expect(screen.getByPlaceholderText('Buscar')).toBeTruthy();
  });
});
