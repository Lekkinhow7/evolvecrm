'use client';

/**
 * @fileoverview Moldura das fichas de call e de visita.
 *
 * Cabe na altura da tela com folga nas bordas: o título fica fixo em cima, os
 * botões fixos embaixo, e só o meio rola, com barra fina. Enquanto a ficha
 * está aberta a página de trás não rola, para não aparecer uma segunda barra.
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function FichaShell({
  rotulo,
  titulo,
  subtitulo,
  onClose,
  rodape,
  acoes,
  larga = false,
  children,
}: {
  rotulo: string;
  titulo: string;
  subtitulo?: React.ReactNode;
  onClose: () => void;
  rodape: React.ReactNode;
  /** Botões ao lado do título, como o de entrar no Meet. */
  acoes?: React.ReactNode;
  /** Ficha em duas colunas no computador. */
  larga?: boolean;
  children: React.ReactNode;
}) {
  // A ficha passa uma função nova a cada render; o Esc usa sempre a mais recente.
  const fechar = useRef(onClose);
  fechar.current = onClose;

  useEffect(() => {
    const main = document.getElementById('main-content');
    const antes = main?.style.overflow ?? '';
    if (main) main.style.overflow = 'hidden';
    const fecharNoEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar.current();
    };
    window.addEventListener('keydown', fecharNoEsc);
    return () => {
      if (main) main.style.overflow = antes;
      window.removeEventListener('keydown', fecharNoEsc);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] dark:bg-slate-900 ${
          larga ? 'max-w-5xl' : 'max-w-2xl'
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-slate-200 border-b px-6 py-4 dark:border-white/10">
          <div className="min-w-0">
            <p className="text-slate-500 text-xs">{rotulo}</p>
            <h2 className="truncate font-semibold text-lg text-slate-900 dark:text-white">{titulo}</h2>
            {subtitulo && <div className="text-slate-500 text-sm">{subtitulo}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {acoes}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white" aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="scrollbar-custom min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        <footer className="flex shrink-0 justify-end gap-2 border-slate-200 border-t px-6 py-3 dark:border-white/10">
          {rodape}
        </footer>
      </div>
    </div>
  );
}
