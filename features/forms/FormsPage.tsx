'use client';

/**
 * @fileoverview Área de formulários do CRM.
 *
 * O gestor cria e edita aqui as perguntas de laudo, orçamento, venda e o que
 * mais a operação precisar, sem depender de publicação de código. Os campos
 * que o dashboard mede têm uma coluna de destino escolhida na própria tela.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Plus, Trash2, ChevronUp, ChevronDown, Power } from 'lucide-react';

import { useToast } from '@/context/ToastContext';
import { useDeals } from '@/lib/query/hooks/useDealsQuery';
import { formsService } from '@/lib/supabase/forms';
import { LinkGerado } from './components/LinkGerado';
import { RespostasRecebidas } from './components/RespostasRecebidas';
import {
  FORM_AUDIENCE_LABEL,
  FORM_FIELD_TYPE_LABEL,
  FORM_TARGET_COLUMNS,
  FORM_TARGET_COLUMN_LABEL,
  type CrmForm,
  type FormAudience,
  type FormField,
  type FormFieldType,
  type FormTargetColumn,
} from '@/types/forms';

const input =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white';
const label = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300';

export function FormsPage() {
  const { showToast } = useToast();
  const [forms, setForms] = useState<CrmForm[]>([]);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await formsService.list();
    if (error) showToast('Não foi possível carregar os formulários', 'error');
    setForms(data || []);
    setSelecionado((atual) => atual || data?.[0]?.id || null);
    setCarregando(false);
  }, [showToast]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const form = useMemo(() => forms.find((f) => f.id === selecionado) || null, [forms, selecionado]);

  const criar = async () => {
    const nome = window.prompt('Nome do formulário', 'Novo formulário');
    if (!nome?.trim()) return;
    const { data, error } = await formsService.create({ name: nome.trim(), audience: 'tecnico', target: 'activity' });
    if (error || !data) {
      showToast('Não foi possível criar', 'error');
      return;
    }
    setForms((f) => [...f, data]);
    setSelecionado(data.id);
  };

  const salvarCabecalho = async (updates: Partial<CrmForm>) => {
    if (!form) return;
    setSalvando(true);
    const { error } = await formsService.update(form.id, updates);
    setSalvando(false);
    if (error) {
      showToast('Não foi possível salvar', 'error');
      return;
    }
    setForms((lista) => lista.map((f) => (f.id === form.id ? { ...f, ...updates } : f)));
  };

  const salvarCampo = async (campo: Partial<FormField> & { label: string }) => {
    if (!form) return;
    const { data, error } = await formsService.saveField(form.id, campo);
    if (error || !data) {
      showToast('Não foi possível salvar o campo', 'error');
      return;
    }
    setForms((lista) =>
      lista.map((f) => {
        if (f.id !== form.id) return f;
        const outros = f.fields.filter((c) => c.id !== data.id);
        return { ...f, fields: [...outros, data].sort((a, b) => a.position - b.position) };
      }),
    );
  };

  const removerCampo = async (id: string) => {
    if (!form || !window.confirm('Remover este campo? As respostas antigas continuam guardadas.')) return;
    const { error } = await formsService.removeField(id);
    if (error) {
      showToast('Não foi possível remover', 'error');
      return;
    }
    setForms((lista) =>
      lista.map((f) => (f.id === form.id ? { ...f, fields: f.fields.filter((c) => c.id !== id) } : f)),
    );
  };

  const mover = async (id: string, direcao: -1 | 1) => {
    if (!form) return;
    const ordenados = [...form.fields].sort((a, b) => a.position - b.position);
    const i = ordenados.findIndex((c) => c.id === id);
    const j = i + direcao;
    if (i < 0 || j < 0 || j >= ordenados.length) return;
    [ordenados[i], ordenados[j]] = [ordenados[j], ordenados[i]];
    const comPosicao = ordenados.map((c, idx) => ({ ...c, position: idx }));
    setForms((lista) => lista.map((f) => (f.id === form.id ? { ...f, fields: comPosicao } : f)));
    await formsService.reorderFields(comPosicao.map((c) => ({ id: c.id, position: c.position })));
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl text-slate-900 dark:text-white">Formulários</h1>
          <p className="text-slate-500 text-sm">
            As perguntas que o técnico e o vendedor respondem. Editáveis aqui, sem publicação.
          </p>
        </div>
        <button
          onClick={criar}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-sm text-white hover:bg-primary-700"
        >
          <Plus size={16} /> Novo formulário
        </button>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {carregando && <p className="text-slate-400 text-sm">Carregando...</p>}
          {!carregando && forms.length === 0 && (
            <p className="rounded-xl border border-slate-200 border-dashed p-4 text-slate-500 text-sm dark:border-white/10">
              Nenhum formulário ainda.
            </p>
          )}
          {forms.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelecionado(f.id)}
              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${
                f.id === selecionado
                  ? 'border-primary-300 bg-primary-50 dark:border-primary-900 dark:bg-primary-950/30'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5'
              }`}
            >
              <ClipboardList size={18} className="mt-0.5 text-slate-400" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-slate-900 text-sm dark:text-white">{f.name}</span>
                <span className="block text-slate-500 text-xs">
                  {FORM_AUDIENCE_LABEL[f.audience]} · {f.fields.length} campo{f.fields.length === 1 ? '' : 's'}
                  {!f.active && ' · desativado'}
                </span>
              </span>
            </button>
          ))}
        </aside>

        {form ? (
          <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={label} htmlFor="nome">Nome</label>
                <input
                  id="nome"
                  className={input}
                  defaultValue={form.name}
                  onBlur={(e) => e.target.value !== form.name && salvarCabecalho({ name: e.target.value })}
                />
              </div>
              <div>
                <label className={label} htmlFor="publico">Quem preenche</label>
                <select
                  id="publico"
                  className={input}
                  value={form.audience}
                  onChange={(e) => salvarCabecalho({ audience: e.target.value as FormAudience })}
                >
                  {Object.entries(FORM_AUDIENCE_LABEL).map(([v, t]) => (
                    <option key={v} value={v}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={label} htmlFor="intro">Texto de abertura</label>
                <input
                  id="intro"
                  className={input}
                  defaultValue={form.intro || ''}
                  placeholder="Aparece no topo para quem vai preencher"
                  onBlur={(e) => e.target.value !== (form.intro || '') && salvarCabecalho({ intro: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className={label} htmlFor="obrigado">Mensagem depois de enviar</label>
                <input
                  id="obrigado"
                  className={input}
                  defaultValue={form.thanksMessage || ''}
                  placeholder="Recebido. Pode fechar esta página."
                  onBlur={(e) =>
                    e.target.value !== (form.thanksMessage || '') && salvarCabecalho({ thanksMessage: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-slate-200 border-t pt-4 dark:border-white/10">
              <h2 className="font-semibold text-slate-900 dark:text-white">Campos</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => salvarCabecalho({ active: !form.active })}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 text-xs dark:border-white/10 dark:text-slate-300"
                >
                  <Power size={14} /> {form.active ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() =>
                    salvarCampo({ label: 'Nova pergunta', type: 'text', position: form.fields.length })
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-white text-xs dark:bg-white dark:text-slate-900"
                >
                  <Plus size={14} /> Adicionar campo
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {form.fields.length === 0 && (
                <p className="text-slate-400 text-sm">Nenhum campo. Comece adicionando a primeira pergunta.</p>
              )}
              {[...form.fields]
                .sort((a, b) => a.position - b.position)
                .map((campo, indice, lista) => (
                  <CampoEditor
                    key={campo.id}
                    campo={campo}
                    primeiro={indice === 0}
                    ultimo={indice === lista.length - 1}
                    onSalvar={salvarCampo}
                    onRemover={removerCampo}
                    onMover={mover}
                  />
                ))}
            </div>

            {salvando && <p className="text-slate-400 text-xs">Salvando...</p>}

            <EnvioPorNegocio form={form} />
            <RespostasRecebidas form={form} />
          </section>
        ) : (
          <section className="flex items-center justify-center rounded-2xl border border-slate-200 border-dashed p-12 text-slate-400 dark:border-white/10">
            Escolha um formulário à esquerda ou crie o primeiro.
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * Gera o link deste formulário para um negócio.
 *
 * A visita tem o botão dentro do próprio detalhe dela, no calendário. Aqui é o
 * caminho para orçamento e venda, que são do negócio e não dependem de visita.
 */
function EnvioPorNegocio({ form }: { form: CrmForm }) {
  const { showToast } = useToast();
  const { data: deals } = useDeals();
  const [dealId, setDealId] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  const abertos = useMemo(
    () => (deals || []).filter((d) => !d.isWon && !d.isLost).slice(0, 200),
    [deals],
  );

  const gerar = async () => {
    if (!dealId) return;
    setGerando(true);
    const resposta = await fetch('/api/forms/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId: form.id, dealId, expiresInHours: 168 }),
    });
    const dados = await resposta.json().catch(() => ({}));
    setGerando(false);
    if (!resposta.ok) {
      showToast(dados?.error || 'Não foi possível gerar o link', 'error');
      return;
    }
    setLink(dados.url);
    await navigator.clipboard?.writeText(dados.url).catch(() => undefined);
    showToast('Link gerado e copiado', 'success');
  };

  return (
    <div className="border-slate-200 border-t pt-5 dark:border-white/10">
      <h2 className="font-semibold text-slate-900 dark:text-white">Enviar este formulário</h2>
      <p className="mb-3 text-slate-500 text-xs">
        Escolha o negócio e gere o link. Ele abre no celular sem login, só desse registro, e vale sete dias.
        Para visita técnica, o botão fica dentro da visita, no calendário.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select className={`${input} max-w-sm`} value={dealId} onChange={(e) => setDealId(e.target.value)}>
          <option value="">Escolha o negócio</option>
          {abertos.map((d) => (
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </select>
        <button
          onClick={gerar}
          disabled={!dealId || gerando}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
        >
          {gerando ? 'Gerando...' : 'Gerar link'}
        </button>
      </div>
      {link && (
        <LinkGerado
          url={link}
          nomeFormulario={form.name}
          contexto={abertos.find((d) => d.id === dealId)?.title}
        />
      )}
    </div>
  );
}

function CampoEditor({
  campo,
  primeiro,
  ultimo,
  onSalvar,
  onRemover,
  onMover,
}: {
  campo: FormField;
  primeiro: boolean;
  ultimo: boolean;
  onSalvar: (campo: Partial<FormField> & { label: string }) => void;
  onRemover: (id: string) => void;
  onMover: (id: string, direcao: -1 | 1) => void;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <button
            disabled={primeiro}
            onClick={() => onMover(campo.id, -1)}
            className="text-slate-400 disabled:opacity-30"
            aria-label="Subir"
          >
            <ChevronUp size={14} />
          </button>
          <button
            disabled={ultimo}
            onClick={() => onMover(campo.id, 1)}
            className="text-slate-400 disabled:opacity-30"
            aria-label="Descer"
          >
            <ChevronDown size={14} />
          </button>
        </div>
        <button onClick={() => setAberto((a) => !a)} className="min-w-0 flex-1 text-left">
          <span className="block truncate font-medium text-slate-900 text-sm dark:text-white">
            {campo.label}
            {campo.required && <span className="ml-1 text-red-500">*</span>}
          </span>
          <span className="block text-slate-500 text-xs">
            {FORM_FIELD_TYPE_LABEL[campo.type]}
            {campo.targetColumn && ` · alimenta ${FORM_TARGET_COLUMN_LABEL[campo.targetColumn]}`}
          </span>
        </button>
        <button onClick={() => onRemover(campo.id)} className="text-slate-400 hover:text-red-600" aria-label="Remover">
          <Trash2 size={15} />
        </button>
      </div>

      {aberto && (
        <div className="mt-3 grid gap-3 border-slate-200 border-t pt-3 md:grid-cols-2 dark:border-white/10">
          <div>
            <label className={label} htmlFor={`l-${campo.id}`}>Pergunta</label>
            <input
              id={`l-${campo.id}`}
              className={input}
              defaultValue={campo.label}
              onBlur={(e) => e.target.value !== campo.label && onSalvar({ ...campo, label: e.target.value })}
            />
          </div>
          <div>
            <label className={label} htmlFor={`t-${campo.id}`}>Tipo</label>
            <select
              id={`t-${campo.id}`}
              className={input}
              value={campo.type}
              onChange={(e) => onSalvar({ ...campo, type: e.target.value as FormFieldType })}
            >
              {Object.entries(FORM_FIELD_TYPE_LABEL).map(([v, t]) => (
                <option key={v} value={v}>{t}</option>
              ))}
            </select>
          </div>
          {campo.type === 'select' && (
            <div className="md:col-span-2">
              <label className={label} htmlFor={`o-${campo.id}`}>Opções, uma por linha</label>
              <textarea
                id={`o-${campo.id}`}
                rows={4}
                className={input}
                defaultValue={(campo.options || []).join('\n')}
                onBlur={(e) =>
                  onSalvar({
                    ...campo,
                    options: e.target.value.split('\n').map((o) => o.trim()).filter(Boolean),
                  })
                }
              />
            </div>
          )}
          <div className="md:col-span-2">
            <label className={label} htmlFor={`a-${campo.id}`}>Ajuda abaixo da pergunta</label>
            <input
              id={`a-${campo.id}`}
              className={input}
              defaultValue={campo.helpText || ''}
              onBlur={(e) => e.target.value !== (campo.helpText || '') && onSalvar({ ...campo, helpText: e.target.value })}
            />
          </div>
          <div>
            <label className={label} htmlFor={`d-${campo.id}`}>Alimenta um número do dashboard</label>
            <select
              id={`d-${campo.id}`}
              className={input}
              value={campo.targetColumn || ''}
              onChange={(e) =>
                onSalvar({ ...campo, targetColumn: (e.target.value || undefined) as FormTargetColumn | undefined })
              }
            >
              <option value="">Não, só fica na resposta</option>
              {FORM_TARGET_COLUMNS.map((c) => (
                <option key={c} value={c}>{FORM_TARGET_COLUMN_LABEL[c]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-slate-700 text-sm dark:text-slate-200">
              <input
                type="checkbox"
                checked={campo.required}
                onChange={(e) => onSalvar({ ...campo, required: e.target.checked })}
              />
              Obrigatório
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
