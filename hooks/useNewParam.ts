'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Abre o "criar novo" de uma tela quando a URL traz `?novo=<valor>`
 * (usado pelo botão Novo do menu lateral, ex.: /contacts?novo=1).
 * Depois de chamar `onNew`, tira o `novo` da URL para não reabrir ao recarregar.
 */
export function useNewParam(onNew: (value: string) => void) {
  const searchParams = useSearchParams();
  const onNewRef = useRef(onNew);
  useEffect(() => {
    onNewRef.current = onNew;
  });

  useEffect(() => {
    const value = searchParams?.get('novo');
    if (!value) return;
    onNewRef.current(value);
    const url = new URL(window.location.href);
    url.searchParams.delete('novo');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }, [searchParams]);
}
