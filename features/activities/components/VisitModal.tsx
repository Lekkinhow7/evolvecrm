'use client';

/**
 * @fileoverview Detalhe da visita técnica.
 *
 * Mostra o que está agendado, deixa mudar situação, técnico, endereço e
 * horário, e gera o link do formulário que vai para quem precisa preencher.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Link2, X } from 'lucide-react';

import { useToast } from '@/context/ToastContext';
import { activitiesService } from '@/lib/supabase/activities';
import { formsService } from '@/lib/supabase/forms';
import type { CrmForm, FormLink, FormSubmission } from '@/types/forms';
import { VISIT_STATUS_LABEL, type Activity, type VisitStatus } from '@/types';

const campo =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white';
const rotulo = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300';

function paraInputLocal(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function VisitModal({
  visita,
  onClose,
  onSalvo,
}: {
  visita: Activity;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<VisitStatus>(visita.visitStatus || 'agendada');
  const [tecnico, setTecnico] = useState(visita.technicianLabel || '');
  const [endereco, setEndereco] = useState(visita.address || '');
  const [referencia, setReferencia] = useState(visita.addressNote || '');
  const [inicio, setInicio] = useState(paraInputLocal(visita.date));
  const [fim, setFim] = useState(paraInputLocal(visita.endsAt));
  const [salvando, setSalvando] = useState(false);

  const [forms, setForms] = useState<CrmForm[]>([]);
  const [formEscolhido, setFormEscolhido] = useState('');
  const [links, setLinks] = useState<FormLink[]>([]);
  const [respostas, setRespostas] = useState<FormSubmission[]>([]);
  const [linkGerado, setLinkGerado] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    const [f, l, r] = await Promise.all([
      formsService.list(),
      formsService.linksFor({ activityId: visita.id }),
      formsService.submissionsFor({ activityId: visita.id }),
    ]);
    const ativos = (f.data || []).filter((x) => x.active);
    setForms(ativos);
    setFormEscolhido((atual) => atual || ativos[0]?.id || '');
    setLinks(l.data || []);
    setRespostas(r.data || []);
  }, [visita.id]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const salvar = async () => {
    setSalvando(true);
    const { error } = await activitiesService.update(visita.id, {
      visitStatus: status,
      technicianLabel: tecnico,
      address: endereco,
      addressNote: referencia,
      date: inicio ? new Date(inicio).toISOString() : visita.date,
      endsAt: fim ? new Date(fim).toISOString() : undefined,
      completed: status === 'concluida',
    });
    setSalvando(false);
    if (error) {
      showToast('Não foi possível salvar a visita', 'error');
      return;
    }
    showToast('Visita atualizada', 'success');
    onSalvo();
  };

  const gerarLink = async () => {
    if (!formEscolhido) return;
    const resposta = await fetch('/api/forms/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formId: formEscolhido,
        activityId: visita.id,
        dealId: visita.dealId || undefined,
        recipientLabel: tecnico || undefined,
        expiresInHours: 168,
      }),
    });
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      showToast(dados?.error || 'Não foi possível gerar o link', 'error');
      return;
    }
    setLinkGerado(dados.url);
    await navigator.clipboard?.writeText(dados.url).catch(() => undefined);
    showToast('Link gerado e copiado', 'success');
    void recarregar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl dark:bg-slate-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-slate-500 text-xs">Visita técnica</p>
            <h2 className="font-semibold text-slate-900 text-xl dark:text-white">{visita.title}</h2>
            {visita.dealTitle && <p className="text-slate-500 text-sm">{visita.dealTitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={rotulo} htmlFor="status">Situação</label>
            <select id="status" className={campo} value={status} onChange={(e) => setStatus(e.target.value as VisitStatus)}>
              {Object.entries(VISIT_STATUS_LABEL).map(([v, t]) => (
                <option key={v} value={v}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={rotulo} htmlFor="tecnico">Técnico</label>
            <input id="tecnico" className={campo} value={tecnico} onChange={(e) => setTecnico(e.target.value)} placeholder="Quem vai na visita" />
          </div>
          <div>
            <label className={rotulo} htmlFor="inicio">Início</label>
            <input id="inicio" type="datetime-local" className={campo} value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div>
            <label className={rotulo} htmlFor="fim">Fim previsto</label>
            <input id="fim" type="datetime-local" className={campo} value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={rotulo} htmlFor="endereco">Endereço</label>
            <input id="endereco" className={campo} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={rotulo} htmlFor="referencia">Referência, portaria, quem recebe</label>
            <input id="referencia" className={campo} value={referencia} onChange={(e) => setReferencia(e.target.value)} />
          </div>
        </div>

        {visita.arrivalAt && (
          <p className="mt-3 text-slate-500 text-xs">
            Chegada informada no laudo: {new Date(visita.arrivalAt).toLocaleString('pt-BR')}
          </p>
        )}

        <div className="mt-6 border-slate-200 border-t pt-5 dark:border-white/10">
          <h3 className="font-semibold text-slate-900 dark:text-white">Formulários</h3>
          <p className="mb-3 text-slate-500 text-xs">
            Gere o link e mande para quem vai preencher. Ele abre no celular sem login e vale por sete dias.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <select className={`${campo} max-w-xs`} value={formEscolhido} onChange={(e) => setFormEscolhido(e.target.value)}>
              {forms.length === 0 && <option value="">Nenhum formulário ativo</option>}
              {forms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <button
              onClick={gerarLink}
              disabled={!formEscolhido}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
            >
              <Link2 size={15} /> Gerar link
            </button>
          </div>

          {linkGerado && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-100 p-3 dark:bg-white/5">
              <code className="min-w-0 flex-1 truncate text-slate-700 text-xs dark:text-slate-200">{linkGerado}</code>
              <button
                onClick={() => navigator.clipboard?.writeText(linkGerado)}
                className="text-slate-500 hover:text-slate-900"
                aria-label="Copiar"
              >
                <Copy size={15} />
              </button>
            </div>
          )}

          {links.length > 0 && (
            <ul className="mt-4 space-y-1 text-xs">
              {links.map((l) => (
                <li key={l.id} className="flex flex-wrap justify-between gap-2 text-slate-500">
                  <span>{l.formName || 'Formulário'}</span>
                  <span>
                    {l.usedAt
                      ? `respondido em ${new Date(l.usedAt).toLocaleString('pt-BR')}`
                      : l.openedAt
                        ? `aberto em ${new Date(l.openedAt).toLocaleString('pt-BR')}, sem resposta`
                        : `enviado, ainda não aberto`}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {respostas.length > 0 && (
            <div className="mt-4 space-y-3">
              {respostas.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                  <p className="font-medium text-slate-900 text-sm dark:text-white">
                    {r.formName || 'Resposta'}
                    <span className="ml-2 font-normal text-slate-500 text-xs">
                      {new Date(r.submittedAt).toLocaleString('pt-BR')}
                      {r.authorLabel ? ` · ${r.authorLabel}` : ''}
                    </span>
                  </p>
                  <dl className="mt-2 space-y-1">
                    {Object.entries(r.answers).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-xs">
                        <dt className="shrink-0 text-slate-500">{k}:</dt>
                        <dd className="text-slate-800 dark:text-slate-200">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                  {r.files.length > 0 && (
                    <p className="mt-2 text-slate-500 text-xs">{r.files.length} arquivo(s) anexado(s)</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-slate-600 text-sm dark:text-slate-300">
            Fechar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-sm text-white disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
