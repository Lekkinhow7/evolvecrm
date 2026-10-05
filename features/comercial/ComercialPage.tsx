'use client';

/**
 * @fileoverview Dashboard comercial.
 *
 * Os números são somados no banco, pela função `crm_commercial_dashboard`, em
 * vez de serem calculados sobre uma página de registros. Aquisição conta pela
 * data de criação, venda conta pela data de fechamento, e o funil é a foto de
 * agora. Dado que não existe aparece como "não informado", nunca como zero.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase/client';
import { useBoards } from '@/lib/query/hooks/useBoardsQuery';

type PeriodoChave = 'hoje' | '7d' | '30d' | 'mes' | 'mes_passado' | '90d' | 'ano';

const PERIODOS: Array<{ chave: PeriodoChave; titulo: string }> = [
  { chave: 'hoje', titulo: 'Hoje' },
  { chave: '7d', titulo: '7 dias' },
  { chave: '30d', titulo: '30 dias' },
  { chave: 'mes', titulo: 'Este mês' },
  { chave: 'mes_passado', titulo: 'Mês passado' },
  { chave: '90d', titulo: '90 dias' },
  { chave: 'ano', titulo: 'Este ano' },
];

function intervalo(chave: PeriodoChave): { de: Date; ate: Date } {
  const agora = new Date();
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const fimHoje = new Date(inicioHoje.getTime() + 86_400_000 - 1);
  switch (chave) {
    case 'hoje':
      return { de: inicioHoje, ate: fimHoje };
    case '7d':
      return { de: new Date(inicioHoje.getTime() - 6 * 86_400_000), ate: fimHoje };
    case '30d':
      return { de: new Date(inicioHoje.getTime() - 29 * 86_400_000), ate: fimHoje };
    case 'mes':
      return { de: new Date(agora.getFullYear(), agora.getMonth(), 1), ate: fimHoje };
    case 'mes_passado':
      return {
        de: new Date(agora.getFullYear(), agora.getMonth() - 1, 1),
        ate: new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59),
      };
    case '90d':
      return { de: new Date(inicioHoje.getTime() - 89 * 86_400_000), ate: fimHoje };
    case 'ano':
      return { de: new Date(agora.getFullYear(), 0, 1), ate: fimHoje };
  }
}

interface Resumo {
  leads_novos: number;
  oportunidades_criadas: number;
  carteira_aberta: number;
  carteira_aberta_valor: number;
  ganhos: number;
  perdidos: number;
  receita_ganha: number;
  ticket_medio: number | null;
  conversao: number | null;
  ciclo_dias: number | null;
  orcamentos_enviados: number;
  orcamentos_valor: number;
  visitas_agendadas: number;
  visitas_realizadas: number;
  visitas_nao_compareceu: number;
  laudos_preenchidos: number;
  horas_ate_laudo: number | null;
  por_etapa: Array<{ etapa: string; ordem: number; quantidade: number; valor: number }>;
  por_origem: Array<{ origem: string; quantidade: number }>;
}

const dinheiro = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export function ComercialPage() {
  const [periodo, setPeriodo] = useState<PeriodoChave>('30d');
  const [boardId, setBoardId] = useState<string>('');
  const [dados, setDados] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const { data: boards } = useBoards();

  const faixa = useMemo(() => intervalo(periodo), [periodo]);

  const carregar = useCallback(async () => {
    if (!supabase) return;
    setCarregando(true);
    setErro(null);
    const { data, error } = await supabase.rpc('crm_commercial_dashboard', {
      p_from: faixa.de.toISOString(),
      p_to: faixa.ate.toISOString(),
      p_board_id: boardId || null,
    });
    if (error) {
      setErro('Não foi possível carregar os números');
      setCarregando(false);
      return;
    }
    setDados(data as unknown as Resumo);
    setCarregando(false);
  }, [boardId, faixa]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl text-slate-900 dark:text-white">Comercial</h1>
          <p className="text-slate-500 text-sm">
            {faixa.de.toLocaleDateString('pt-BR')} até {faixa.ate.toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={boardId}
            onChange={(e) => setBoardId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <option value="">Todos os funis</option>
            {(boards || []).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/5">
            {PERIODOS.map((p) => (
              <button
                key={p.chave}
                onClick={() => setPeriodo(p.chave)}
                className={`rounded-md px-3 py-1 text-sm ${
                  periodo === p.chave
                    ? 'bg-white font-medium text-slate-900 shadow-sm dark:bg-white/15 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {p.titulo}
              </button>
            ))}
          </div>
        </div>
      </header>

      {erro && <p className="rounded-xl bg-red-50 p-4 text-red-700 text-sm">{erro}</p>}
      {carregando && <p className="text-slate-400 text-sm">Carregando...</p>}

      {dados && !carregando && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Cartao
              titulo="Leads novos"
              valor={String(dados.leads_novos)}
              nota="Contatos criados no período, por qualquer entrada: site, WhatsApp ou cadastro manual."
            />
            <Cartao
              titulo="Carteira aberta"
              valor={String(dados.carteira_aberta)}
              nota={`Negócios que não foram ganhos nem perdidos, somando ${dinheiro(dados.carteira_aberta_valor)}. É foto de agora, não do período.`}
            />
            <Cartao
              titulo="Vendas fechadas"
              valor={String(dados.ganhos)}
              nota={`Contadas pela data em que foram fechadas, não pela data em que o lead entrou. Receita de ${dinheiro(dados.receita_ganha)}.`}
            />
            <Cartao
              titulo="Conversão"
              valor={dados.conversao === null ? 'não informado' : `${dados.conversao}%`}
              nota={`Ganhos divididos por ganhos mais perdidos no período: ${dados.ganhos} de ${dados.ganhos + dados.perdidos}. Negócio ainda aberto não entra na conta.`}
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Cartao
              titulo="Ticket médio"
              valor={dados.ticket_medio === null ? 'não informado' : dinheiro(dados.ticket_medio)}
              nota="Receita das vendas fechadas dividida pelo número delas."
            />
            <Cartao
              titulo="Ciclo de venda"
              valor={dados.ciclo_dias === null ? 'não informado' : `${dados.ciclo_dias} dias`}
              nota="Tempo médio entre a entrada do lead e o fechamento, só das vendas ganhas."
            />
            <Cartao
              titulo="Orçamentos enviados"
              valor={String(dados.orcamentos_enviados)}
              nota={`Somando ${dinheiro(dados.orcamentos_valor)} em propostas. Conta pela data de envio do orçamento.`}
            />
            <Cartao
              titulo="Oportunidades criadas"
              valor={String(dados.oportunidades_criadas)}
              nota="Negócios abertos no período, independente de já terem fechado."
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Cartao
              titulo="Visitas agendadas"
              valor={String(dados.visitas_agendadas)}
              nota="Visitas técnicas marcadas com data dentro do período."
            />
            <Cartao
              titulo="Visitas realizadas"
              valor={String(dados.visitas_realizadas)}
              nota={
                dados.visitas_agendadas > 0
                  ? `${Math.round((100 * dados.visitas_realizadas) / dados.visitas_agendadas)}% das agendadas. ${dados.visitas_nao_compareceu} com ninguém no local.`
                  : 'Nenhuma visita agendada no período.'
              }
            />
            <Cartao
              titulo="Laudos preenchidos"
              valor={String(dados.laudos_preenchidos)}
              nota="Visitas em que o técnico enviou o formulário de laudo."
            />
            <Cartao
              titulo="Tempo até o laudo"
              valor={dados.horas_ate_laudo === null ? 'não informado' : `${dados.horas_ate_laudo} h`}
              nota="Média entre o horário da visita e o envio do laudo."
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <h2 className="font-semibold text-slate-900 dark:text-white">Funil agora</h2>
              <p className="mb-4 text-slate-500 text-xs">
                Quantos negócios abertos existem em cada etapa neste momento, com o valor somado.
              </p>
              <div className="space-y-2">
                {dados.por_etapa.length === 0 && <p className="text-slate-400 text-sm">Sem etapas.</p>}
                {dados.por_etapa.map((e) => {
                  const maior = Math.max(...dados.por_etapa.map((x) => x.quantidade), 1);
                  return (
                    <div key={`${e.ordem}-${e.etapa}`} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 truncate text-slate-700 text-sm dark:text-slate-200">{e.etapa}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{ width: `${Math.round((100 * e.quantidade) / maior)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-slate-900 text-sm dark:text-white">{e.quantidade}</span>
                      <span className="w-24 text-right text-slate-500 text-xs">{dinheiro(e.valor)}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <h2 className="font-semibold text-slate-900 dark:text-white">De onde vieram</h2>
              <p className="mb-4 text-slate-500 text-xs">
                Origem registrada no contato no momento em que ele entrou, dentro do período.
              </p>
              <div className="space-y-2">
                {dados.por_origem.length === 0 && <p className="text-slate-400 text-sm">Nenhum lead no período.</p>}
                {dados.por_origem.map((o) => (
                  <div key={o.origem} className="flex items-center justify-between border-slate-100 border-b py-1.5 text-sm last:border-0 dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-200">{o.origem}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{o.quantidade}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Cartao({ titulo, valor, nota }: { titulo: string; valor: string; nota: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-slate-500 text-sm">{titulo}</p>
      <p className="mt-1 font-semibold text-2xl text-slate-900 dark:text-white">{valor}</p>
      <p className="mt-2 text-slate-500 text-xs leading-relaxed">{nota}</p>
    </div>
  );
}
