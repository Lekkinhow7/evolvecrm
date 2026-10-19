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
    // Estado `null` (sem a marca interna do Next) faz o roteador atualizar os parâmetros da URL;
    // assim o próximo clique em "Novo" na mesma tela muda o `novo` de novo e reabre o cadastro.
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, [searchParams]);
}
