'use client';

/**
 * @fileoverview Ficha da call do vendedor.
 *
 * O vendedor deixa esta ficha aberta durante a call no Google Meet, às vezes
 * compartilhando a tela com o cliente. Por isso ela só mostra o que o cliente
 * pode ver: a lista de técnicos vem só com nome e se está livre, e as
 * anotações podem ser escondidas com um clique. As anotações são salvas
 * enquanto ele digita; o resultado só sai pelo botão de salvar.
 */

import React, { useEffect, useRef, useState } from 'react';
import { EyeOff, Eye, Video } from 'lucide-react';

import { useToast } from '@/context/ToastContext';
import { activitiesService } from '@/lib/supabase/activities';
import {
  callPendente,
  DURACAO_VISITA_MIN,
  fimDaCall,
  MOTIVOS_SEM_INTERESSE,
  RESULTADO_LABEL,
  RESULTADOS,
  type MotivoSemInteresse,
  type ResultadoCall,
} from '@/lib/calls/ficha';
import type { Activity } from '@/types';

import { FichaShell } from './FichaShell';

const campo =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white';
const rotulo = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300';

const hora = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

interface TecnicoNaTela {
  id: string;
  nome: string;
  livre: boolean;
}

/** Ícone de cada resultado, no botão e no cartão do resultado. */
const ICONE_RESULTADO: Record<ResultadoCall, string> = {
  agendar_visita: '📅',
  sem_interesse: '🚫',
  retornar: '🔁',
  nao_atendeu: '📵',
};

export function CallModal({
  call,
  visitaAgendada,
  onAbrirVisita,
  onClose,
  onSalvo,
}: {
  call: Activity;
  /** A visita que nasceu desta call, quando o resultado foi agendar visita. */
  visitaAgendada?: Activity | null;
  onAbrirVisita?: (visita: Activity) => void;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const { showToast } = useToast();
  const inicioCall = new Date(call.date);
  const fimCall = fimDaCall(call);
  const pendente = callPendente(call);
  const nome = call.dealTitle || call.title;

  const [anotacoes, setAnotacoes] = useState(call.callNotes || '');
  const [anotacoesOcultas, setAnotacoesOcultas] = useState(false);
  const [salvandoNotas, setSalvandoNotas] = useState<'salvo' | 'salvando' | 'erro' | null>(null);
  const ultimaSalva = useRef(call.callNotes || '');

  const [resultado, setResultado] = useState<ResultadoCall | null>(null);
  const [inicioVisita, setInicioVisita] = useState('');
  const [endereco, setEndereco] = useState(call.address || '');
  const [referencia, setReferencia] = useState(call.addressNote || '');
  const [tecnicos, setTecnicos] = useState<TecnicoNaTela[]>([]);
  const [tecnicoId, setTecnicoId] = useState('');
  const [buscandoTecnicos, setBuscandoTecnicos] = useState(false);
  const [erroTecnicos, setErroTecnicos] = useState<string | null>(null);
  const [motivo, setMotivo] = useState<MotivoSemInteresse | ''>('');
  const [retornarEm, setRetornarEm] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Salva as anotações um pouco depois que o vendedor para de digitar.
  useEffect(() => {
    if (anotacoes === ultimaSalva.current) return;
    const t = setTimeout(async () => {
      setSalvandoNotas('salvando');
      const { error } = await activitiesService.update(call.id, { callNotes: anotacoes });
      if (error) {
        setSalvandoNotas('erro');
        return;
      }
      ultimaSalva.current = anotacoes;
      setSalvandoNotas('salvo');
    }, 1200);
    return () => clearTimeout(t);
  }, [anotacoes, call.id]);

  // Lista de técnicos do horário escolhido, com o sugerido já marcado.
  useEffect(() => {
    if (resultado !== 'agendar_visita') return;
    const quando = new Date(inicioVisita);
    if (!inicioVisita || Number.isNaN(quando.getTime())) {
      setTecnicos([]);
      return;
    }
    let cancelado = false;
    const t = setTimeout(async () => {
      setBuscandoTecnicos(true);
      setErroTecnicos(null);
      const r = await fetch(
        `/api/calls/${call.id}/tecnicos?inicio=${encodeURIComponent(quando.toISOString())}&duracao=${DURACAO_VISITA_MIN}`,
      ).catch(() => null);
      const dados = r ? await r.json().catch(() => ({})) : {};
      if (cancelado) return;
      setBuscandoTecnicos(false);
      if (!r || !r.ok) {
        setErroTecnicos(dados?.error || 'Não foi possível carregar os técnicos');
        setTecnicos([]);
        return;
      }
      const lista: TecnicoNaTela[] = dados.tecnicos || [];
      setTecnicos(lista);
      setTecnicoId((atual) => {
        const aindaLivre = lista.some((x) => x.id === atual && x.livre);
        return aindaLivre ? atual : dados.sugerido || '';
      });
    }, 400);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [resultado, inicioVisita, call.id]);

  const salvar = async () => {
    if (!resultado) return;
    setSalvando(true);
    const corpo: Record<string, unknown> = { resultado, anotacoes };
    if (resultado === 'agendar_visita') {
      corpo.visita = {
        inicio: inicioVisita ? new Date(inicioVisita).toISOString() : '',
        duracaoMin: DURACAO_VISITA_MIN,
        endereco,
        referencia,
        tecnicoId,
      };
    }
    if (resultado === 'sem_interesse') corpo.motivo = motivo || undefined;
    if (resultado === 'retornar') corpo.retornarEm = retornarEm ? new Date(retornarEm).toISOString() : undefined;

    const r = await fetch(`/api/calls/${call.id}/resultado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    }).catch(() => null);
    const dados = r ? await r.json().catch(() => ({})) : {};
    setSalvando(false);
    if (!r || !r.ok) {
      showToast(dados?.error || 'Não foi possível salvar o resultado', 'error');
      return;
    }
    showToast(resultado === 'agendar_visita' ? 'Visita agendada e técnico avisado' : 'Resultado da call salvo', 'success');
    onSalvo();
  };

  const podeSalvar =
    resultado !== null &&
    !salvando &&
    (resultado !== 'agendar_visita' || Boolean(inicioVisita && endereco.trim().length >= 3 && tecnicoId)) &&
    (resultado !== 'sem_interesse' || Boolean(motivo)) &&
    (resultado !== 'retornar' || Boolean(retornarEm));

  const resumo = (
    <>
      {inicioCall.toLocaleDateString('pt-BR')}, das {hora(inicioCall)} às {hora(fimCall)}
      {call.sellerLabel ? ` · Vendedor: ${call.sellerLabel}` : ''}
    </>
  );

  const cartao = 'rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]';
  const titulo = 'mb-3 flex items-center gap-2 font-semibold text-slate-900 text-sm dark:text-white';
  const visitaInicio = visitaAgendada ? new Date(visitaAgendada.date) : null;

  return (
    <FichaShell
      rotulo="📞 Call"
      titulo={nome}
      subtitulo={resumo}
      onClose={onClose}
      larga
      acoes={
        call.meetingUrl ? (
          <a
            href={call.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 font-medium text-sm text-white hover:bg-primary-500"
          >
            <Video size={15} /> Entrar no Meet
          </a>
        ) : null
      }
      rodape={
        <>
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-slate-600 text-sm dark:text-slate-300">
            Fechar
          </button>
          {!call.callResult && (
            <button
              onClick={salvar}
              disabled={!podeSalvar}
              className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-sm text-white disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : resultado === 'agendar_visita' ? 'Agendar visita' : 'Salvar resultado'}
            </button>
          )}
        </>
      }
    >
      {pendente && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm dark:border-red-500/20 dark:bg-red-900/20 dark:text-red-300">
          ⚠️ Esta call já terminou e ainda está sem resultado.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Esquerda: o que se sabe do cliente e as anotações da conversa. */}
        <div className="space-y-5 lg:col-span-3">
          <section className={cartao}>
            <h3 className={titulo}>📝 O que o cliente contou</h3>
            {call.description ? (
              <p className="whitespace-pre-line text-slate-700 text-sm leading-relaxed dark:text-slate-300">{call.description}</p>
            ) : (
              <p className="text-slate-500 text-sm">Nada registrado na conversa com a Marina.</p>
            )}
            {call.address && (
              <p className="mt-3 border-slate-200 border-t pt-3 text-slate-700 text-sm dark:border-white/10 dark:text-slate-300">
                📍 {call.address}
              </p>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <label className={titulo.replace('mb-3 ', '')} htmlFor="anotacoes">✍️ Anotações da call</label>
              <button
                type="button"
                onClick={() => setAnotacoesOcultas((v) => !v)}
                className="flex items-center gap-1 text-slate-500 text-xs hover:text-slate-800 dark:hover:text-white"
              >
                {anotacoesOcultas ? <Eye size={14} /> : <EyeOff size={14} />}
                {anotacoesOcultas ? 'Mostrar' : 'Ocultar'}
              </button>
            </div>
            {anotacoesOcultas ? (
              <p className="rounded-lg border border-dashed border-slate-300 px-3 py-8 text-center text-slate-400 text-sm dark:border-white/10">
                Anotações ocultas
              </p>
            ) : (
              <textarea
                id="anotacoes"
                rows={6}
                className={`${campo} scrollbar-custom resize-none`}
                value={anotacoes}
                onChange={(e) => setAnotacoes(e.target.value)}
                placeholder="O que o cliente está contando: piscinas, urgência, quem decide..."
                disabled={Boolean(call.callResult)}
              />
            )}
            {salvandoNotas && (
              <p className="mt-1 text-slate-400 text-xs">
                {salvandoNotas === 'salvando' ? 'Salvando...' : salvandoNotas === 'salvo' ? 'Anotações salvas' : 'Não foi possível salvar as anotações'}
              </p>
            )}
          </section>
        </div>

        {/* Direita: o resultado e, se for o caso, a visita. */}
        <div className="lg:col-span-2">
          {call.callResult ? (
            <section className={`${cartao} space-y-4`}>
              <div>
                <p className="text-slate-500 text-xs">Resultado da call</p>
                <p className="mt-1 flex items-center gap-2 font-semibold text-base text-slate-900 dark:text-white">
                  {ICONE_RESULTADO[call.callResult]} {RESULTADO_LABEL[call.callResult]}
                </p>
                {call.callResultAt && (
                  <p className="text-slate-500 text-xs">Registrado em {new Date(call.callResultAt).toLocaleString('pt-BR')}</p>
                )}
              </div>

              {call.callResult === 'agendar_visita' && (
                visitaAgendada && visitaInicio ? (
                  <div className="space-y-2 border-slate-200 border-t pt-4 text-slate-700 text-sm dark:border-white/10 dark:text-slate-300">
                    <p className="font-medium text-slate-900 dark:text-white">🔧 Visita técnica</p>
                    <p>🗓️ {visitaInicio.toLocaleDateString('pt-BR')}, às {hora(visitaInicio)}</p>
                    <p>👷 {visitaAgendada.technicianLabel || 'técnico não definido'}</p>
                    {visitaAgendada.address && <p>📍 {visitaAgendada.address}</p>}
                    {onAbrirVisita && (
                      <button
                        type="button"
                        onClick={() => onAbrirVisita(visitaAgendada)}
                        className="mt-2 w-full rounded-lg border border-primary-500 px-3 py-2 font-medium text-primary-600 text-sm hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10"
                      >
                        Abrir visita
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="border-slate-200 border-t pt-4 text-slate-500 text-sm dark:border-white/10">A visita foi agendada.</p>
                )
              )}

              {call.returnAt && (
                <p className="border-slate-200 border-t pt-4 text-slate-700 text-sm dark:border-white/10 dark:text-slate-300">
                  🔁 Retornar em {new Date(call.returnAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              )}
            </section>
          ) : (
            <section className={cartao}>
              <h3 className={titulo}>Como foi a call?</h3>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {RESULTADOS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResultado(r)}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-sm transition-colors ${
                      resultado === r
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-lg leading-none">{ICONE_RESULTADO[r]}</span>
                    {RESULTADO_LABEL[r]}
                  </button>
                ))}
              </div>

              {!resultado && <p className="text-slate-500 text-sm">Escolha como terminou a conversa.</p>}

              {resultado === 'agendar_visita' && (
                <div className="space-y-3">
                  <div>
                    <label className={rotulo} htmlFor="inicio-visita">🗓️ Dia e hora da visita</label>
                    <input id="inicio-visita" type="datetime-local" className={campo} value={inicioVisita} onChange={(e) => setInicioVisita(e.target.value)} />
                  </div>
                  <div>
                    <label className={rotulo} htmlFor="endereco">📍 Endereço da visita</label>
                    <input id="endereco" className={campo} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
                  </div>
                  <div>
                    <label className={rotulo} htmlFor="referencia">Referência, portaria, quem recebe</label>
                    <input id="referencia" className={campo} value={referencia} onChange={(e) => setReferencia(e.target.value)} />
                  </div>
                  <div>
                    <p className={rotulo}>🔧 Técnico da visita</p>
                    {!inicioVisita && <p className="text-slate-500 text-sm">Escolha o dia e a hora para ver quem está livre.</p>}
                    {buscandoTecnicos && <p className="text-slate-500 text-sm">Conferindo a agenda dos técnicos...</p>}
                    {erroTecnicos && <p className="text-red-600 text-sm">{erroTecnicos}</p>}
                    {!buscandoTecnicos && inicioVisita && !erroTecnicos && tecnicos.length === 0 && (
                      <p className="text-slate-500 text-sm">Nenhum técnico cadastrado.</p>
                    )}
                    <div className="space-y-2">
                      {tecnicos.map((t) => (
                        <label
                          key={t.id}
                          className={`flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-sm dark:bg-white/5 ${
                            t.livre ? 'cursor-pointer border-slate-300 dark:border-white/10' : 'cursor-not-allowed border-slate-200 opacity-60 dark:border-white/5'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="tecnico"
                              value={t.id}
                              checked={tecnicoId === t.id}
                              disabled={!t.livre}
                              onChange={() => setTecnicoId(t.id)}
                            />
                            <span className="text-slate-900 dark:text-white">{t.nome}</span>
                          </span>
                          <span className="text-slate-500 text-xs">{t.livre ? 'livre' : 'ocupado 🚫'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {resultado === 'sem_interesse' && (
                <div>
                  <label className={rotulo} htmlFor="motivo">Motivo</label>
                  <select id="motivo" className={campo} value={motivo} onChange={(e) => setMotivo(e.target.value as MotivoSemInteresse)}>
                    <option value="">Escolha o motivo</option>
                    {Object.entries(MOTIVOS_SEM_INTERESSE).map(([v, t]) => (
                      <option key={v} value={v}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              {resultado === 'retornar' && (
                <div>
                  <label className={rotulo} htmlFor="retornar">Quando retornar</label>
                  <input id="retornar" type="datetime-local" className={campo} value={retornarEm} onChange={(e) => setRetornarEm(e.target.value)} />
                </div>
              )}

              {resultado === 'nao_atendeu' && (
                <p className="text-slate-500 text-sm">Fica registrado para o follow-up tentar de novo.</p>
              )}
            </section>
          )}
        </div>
      </div>
    </FichaShell>
  );
}
