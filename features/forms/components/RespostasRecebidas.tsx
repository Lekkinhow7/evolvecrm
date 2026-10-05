'use client';

/**
 * @fileoverview Respostas já recebidas de um formulário.
 *
 * Mostra quem respondeu, quando, de qual negócio ou visita veio, e as respostas
 * com o nome da pergunta, não com a chave interna. Anexo abre por endereço
 * temporário, porque o balde é privado.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Paperclip, RefreshCw } from 'lucide-react';

import { formsService } from '@/lib/supabase/forms';
import type { CrmForm, FormSubmission } from '@/types/forms';

export function RespostasRecebidas({ form }: { form: CrmForm }) {
  const [respostas, setRespostas] = useState<FormSubmission[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data } = await formsService.submissionsByForm(form.id);
    setRespostas(data || []);
    setCarregando(false);
  }, [form.id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const rotulo = (chave: string) => form.fields.find((c) => c.key === chave)?.label || chave;

  const abrirArquivo = async (caminho: string) => {
    const r = await fetch(`/api/forms/arquivo?path=${encodeURIComponent(caminho)}`);
    const j = await r.json().catch(() => ({}));
    if (j?.url) window.open(j.url, '_blank', 'noopener');
  };

  return (
    <div className="border-slate-200 border-t pt-5 dark:border-white/10">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">Respostas recebidas</h2>
          <p className="text-slate-500 text-xs">
            {carregando ? 'Carregando...' : `${respostas.length} resposta${respostas.length === 1 ? '' : 's'} neste formulário.`}
          </p>
        </div>
        <button
          onClick={carregar}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 text-xs dark:border-white/10 dark:text-slate-300"
        >
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {!carregando && respostas.length === 0 && (
        <p className="text-slate-400 text-sm">Ninguém respondeu este formulário ainda.</p>
      )}

      <div className="space-y-3">
        {respostas.map((r) => (
          <details key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
            <summary className="cursor-pointer list-none">
              <span className="font-medium text-slate-900 text-sm dark:text-white">
                {r.authorLabel || 'Sem nome'}
              </span>
              <span className="ml-2 text-slate-500 text-xs">
                {new Date(r.submittedAt).toLocaleString('pt-BR')}
                {r.formName ? ` · ${r.formName}` : ''}
                {r.activityId ? ' · visita' : r.dealId ? ' · negócio' : ''}
                {r.files.length ? ` · ${r.files.length} anexo(s)` : ''}
              </span>
            </summary>

            <dl className="mt-3 space-y-1.5 border-slate-100 border-t pt-3 dark:border-white/5">
              {Object.entries(r.answers).map(([chave, valor]) => (
                <div key={chave} className="grid grid-cols-[minmax(0,11rem)_1fr] gap-2 text-sm">
                  <dt className="text-slate-500">{rotulo(chave)}</dt>
                  <dd className="text-slate-900 dark:text-slate-100">{String(valor) || '—'}</dd>
                </div>
              ))}
            </dl>

            {r.files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 border-slate-100 border-t pt-3 dark:border-white/5">
                {r.files.map((a) => (
                  <button
                    key={a.path}
                    onClick={() => abrirArquivo(a.path)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 text-xs hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200"
                  >
                    <Paperclip size={13} /> {a.name}
                  </button>
                ))}
              </div>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
