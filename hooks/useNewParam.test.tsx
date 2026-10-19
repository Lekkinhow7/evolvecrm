import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

let params = new URLSearchParams('novo=reuniao&view=calendar');
vi.mock('next/navigation', () => ({ useSearchParams: () => params }));

import { useNewParam } from './useNewParam';

function Probe({ onNew }: { onNew: (v: string) => void }) {
  useNewParam(onNew);
  return null;
}

describe('useNewParam', () => {
  it('chama onNew com o valor e tira o novo da URL', () => {
    window.history.replaceState(null, '', '/activities?novo=reuniao&view=calendar');
    const onNew = vi.fn();
    render(<Probe onNew={onNew} />);
    expect(onNew).toHaveBeenCalledWith('reuniao');
    expect(window.location.search).toBe('?view=calendar');
  });

  it('não repassa o estado interno do Next, para o roteador ver a URL nova', () => {
    params = new URLSearchParams('novo=1');
    window.history.replaceState({ __NA: true }, '', '/contacts?novo=1');
    render(<Probe onNew={vi.fn()} />);
    expect(window.history.state).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('sem novo na URL, não faz nada', () => {
    params = new URLSearchParams('');
    const onNew = vi.fn();
    render(<Probe onNew={onNew} />);
    expect(onNew).not.toHaveBeenCalled();
  });
});
