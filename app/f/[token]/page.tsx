'use client';

/**
 * Página pública do formulário por link assinado.
 *
 * Feita para celular: o técnico abre, preenche, anexa foto e envia. Não mostra
 * nada do CRM além do próprio formulário.
 */

import React, { use, useCallback, useEffect, useState } from 'react';

interface CampoPublico {
  key: string;
  label: string;
  helpText?: string;
  type: string;
  options?: string[];
  required: boolean;
}

interface Definicao {
  form: { name: string; description?: string; intro?: string; fields: CampoPublico[] };
  contexto: { titulo?: string; endereco?: string; quando?: string };
  destinatario?: string | null;
  jaRespondido: boolean;
}

const campoBase =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10';

export default function FormularioPublicoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [definicao, setDefinicao] = useState<Definicao | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [autor, setAutor] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    fetch(`/api/f/${token}`)
      .then(async (r) => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
      .then(({ ok, body }) => {
        if (!ativo) return;
        if (!ok) {
          setErroCarga(body?.error || 'Link inválido');
          return;
        }
        setDefinicao(body as Definicao);
        if (body?.destinatario) setAutor(String(body.destinatario));
      })
      .catch(() => ativo && setErroCarga('Não foi possível abrir o formulário'));
    return () => {
      ativo = false;
    };
  }, [token]);

  const enviar = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!definicao || enviando) return;
      setEnviando(true);
      setErro(null);

      const corpo = new FormData();
      corpo.append('answers', JSON.stringify(respostas));
      corpo.append('author', autor);
      arquivos.forEach((a) => corpo.append('files', a));

      try {
        const resposta = await fetch(`/api/f/${token}`, { method: 'POST', body: corpo });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) {
          setErro(dados?.error || 'Não foi possível enviar');
          setEnviando(false);
          return;
        }
        setPronto(dados?.mensagem || 'Recebido.');
      } catch {
        setErro('Sem conexão. Tente de novo.');
        setEnviando(false);
      }
    },
    [arquivos, autor, definicao, enviando, respostas, token],
  );

  if (erroCarga) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
        <h1 className="font-semibold text-slate-900 text-xl">{erroCarga}</h1>
        <p className="text-slate-500 text-sm">Peça um link novo para quem te enviou.</p>
      </main>
    );
  }

  if (pronto) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">✓</div>
        <h1 className="font-semibold text-slate-900 text-xl">Enviado</h1>
        <p className="text-slate-600">{pronto}</p>
      </main>
    );
  }

  if (!definicao) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-slate-50 px-6">
        <p className="text-slate-400">Carregando...</p>
      </main>
    );
  }

  const { form, contexto, jaRespondido } = definicao;

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto max-w-md px-5 pt-8">
        <h1 className="font-semibold text-2xl text-slate-900">{form.name}</h1>
        {form.description && <p className="mt-1 text-slate-500 text-sm">{form.description}</p>}

        {(contexto.titulo || contexto.endereco || contexto.quando) && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            {contexto.titulo && <p className="font-medium text-slate-900">{contexto.titulo}</p>}
            {contexto.quando && (
              <p className="mt-1 text-slate-500">
                {new Date(contexto.quando).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            )}
            {contexto.endereco && <p className="mt-1 text-slate-500">{contexto.endereco}</p>}
          </div>
        )}

        {jaRespondido && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-amber-800 text-sm">
            Este formulário já foi respondido uma vez. Enviar de novo registra uma nova resposta.
          </p>
        )}

        {form.intro && <p className="mt-4 text-slate-600 text-sm">{form.intro}</p>}

        <form onSubmit={enviar} className="mt-6 space-y-5">
          {form.fields.map((campo) => (
            <div key={campo.key}>
              <label htmlFor={campo.key} className="mb-1.5 block font-medium text-slate-800 text-sm">
                {campo.label}
                {campo.required && <span className="ml-1 text-red-500">*</span>}
              </label>
              {campo.helpText && <p className="mb-1.5 text-slate-500 text-xs">{campo.helpText}</p>}

              {campo.type === 'textarea' ? (
                <textarea
                  id={campo.key}
                  rows={4}
                  required={campo.required}
                  className={campoBase}
                  value={respostas[campo.key] || ''}
                  onChange={(e) => setRespostas((r) => ({ ...r, [campo.key]: e.target.value }))}
                />
              ) : campo.type === 'select' ? (
                <select
                  id={campo.key}
                  required={campo.required}
                  className={campoBase}
                  value={respostas[campo.key] || ''}
                  onChange={(e) => setRespostas((r) => ({ ...r, [campo.key]: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  {(campo.options || []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : campo.type === 'boolean' ? (
                <select
                  id={campo.key}
                  required={campo.required}
                  className={campoBase}
                  value={respostas[campo.key] || ''}
                  onChange={(e) => setRespostas((r) => ({ ...r, [campo.key]: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              ) : campo.type === 'file' ? (
                <input
                  id={campo.key}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="w-full text-slate-600 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white file:text-sm"
                  onChange={(e) => setArquivos(Array.from(e.target.files || []))}
                />
              ) : (
                <input
                  id={campo.key}
                  type={
                    campo.type === 'number' || campo.type === 'currency'
                      ? 'text'
                      : campo.type === 'date'
                        ? 'date'
                        : campo.type === 'time'
                          ? 'time'
                          : campo.type === 'phone'
                            ? 'tel'
                            : 'text'
                  }
                  inputMode={campo.type === 'number' || campo.type === 'currency' ? 'decimal' : undefined}
                  required={campo.required}
                  className={campoBase}
                  value={respostas[campo.key] || ''}
                  onChange={(e) => setRespostas((r) => ({ ...r, [campo.key]: e.target.value }))}
                />
              )}
            </div>
          ))}

          {arquivos.length > 0 && (
            <p className="text-slate-500 text-xs">
              {arquivos.length} arquivo{arquivos.length > 1 ? 's' : ''} selecionado
              {arquivos.length > 1 ? 's' : ''}
            </p>
          )}

          <div>
            <label htmlFor="autor" className="mb-1.5 block font-medium text-slate-800 text-sm">
              Quem está preenchendo
            </label>
            <input
              id="autor"
              className={campoBase}
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          {erro && <p className="rounded-xl bg-red-50 p-3 text-red-700 text-sm">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl bg-slate-900 px-4 py-3.5 font-medium text-white disabled:opacity-60"
          >
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </main>
  );
}
