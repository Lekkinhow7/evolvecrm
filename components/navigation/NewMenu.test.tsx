import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('next/link', () => {
  const MockLink = React.forwardRef<HTMLAnchorElement, { href: string; children?: React.ReactNode }>(({ href, children, ...rest }, ref) => (
    <a ref={ref} href={href} {...rest}>{children}</a>
  ));
  MockLink.displayName = 'MockLink';
  return { default: MockLink };
});

import { NewMenu } from './NewMenu';

describe('NewMenu', () => {
  it('abre a lista com os atalhos de criação', async () => {
    render(<NewMenu collapsed={false} />);
    fireEvent.keyDown(screen.getByRole('button', { name: /Novo/ }), { key: 'Enter' });
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((i) => i.getAttribute('href'))).toEqual([
      '/contacts?novo=1',
      '/boards?novo=1',
      '/agenda?novo=reuniao',
      '/activities?novo=tarefa',
    ]);
    expect(screen.getByText('Nova reunião')).toBeTruthy();
  });

  it('recolhido, mostra só o ícone com nome acessível', () => {
    render(<NewMenu collapsed />);
    expect(screen.getByRole('button', { name: 'Novo' })).toBeTruthy();
    expect(screen.queryByText('Novo')).toBeNull();
  });
});
