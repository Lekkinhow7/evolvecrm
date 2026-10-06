/**
 * @fileoverview Devolve ao banco do agente o que foi preenchido no CRM.
 *
 * O atendimento da IA lê a visita no banco do agente para saber o que já
 * aconteceu. Quando o laudo, o orçamento ou a venda são preenchidos no CRM,
 * avisa o n8n, que grava os mesmos campos na visita de origem. Sem isso a IA
 * cobraria um laudo já entregue e a sincronização voltaria o cartão de etapa.
 *
 * @module lib/forms/retorno
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/** Formulário do CRM e o que ele representa no banco do agente. */
const TIPO_POR_FORMULARIO: Record<string, 'laudo' | 'orcamento' | 'venda'> = {
  laudo_visita: 'laudo',
  orcamento: 'orcamento',
  venda: 'venda',
};

const PREFIXO_ORIGEM = 'sz-agendamento-';

/** Acha o agendamento de origem pela visita, ou pela visita mais recente do negócio. */
async function agendamentoDeOrigem(
  supabase: SupabaseClient,
  dados: { activityId?: string | null; dealId?: string | null },
): Promise<string | null> {
  if (dados.activityId) {
    const v = await supabase.from('activities').select('external_ref').eq('id', dados.activityId).maybeSingle();
    const ref = String(v.data?.external_ref || '');
    if (ref.startsWith(PREFIXO_ORIGEM)) return ref.slice(PREFIXO_ORIGEM.length);
  }
  if (dados.dealId) {
    const v = await supabase
      .from('activities')
      .select('external_ref')
      .eq('deal_id', dados.dealId)
      .eq('type', 'VISITA')
      .like('external_ref', `${PREFIXO_ORIGEM}%`)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    const ref = String(v.data?.external_ref || '');
    if (ref.startsWith(PREFIXO_ORIGEM)) return ref.slice(PREFIXO_ORIGEM.length);
  }
  return null;
}

/**
 * Manda para o n8n as respostas do formulário, se ele corresponder a uma visita
 * que veio do banco do agente. Falha aqui não derruba o envio do formulário: o
 * técnico já terminou o trabalho dele, o erro fica no log.
 */
export async function devolverAoBancoDoAgente(
  supabase: SupabaseClient,
  dados: {
    formKey: string;
    activityId?: string | null;
    dealId?: string | null;
    respostas: Record<string, unknown>;
  },
): Promise<{ enviado: boolean; motivo?: string }> {
  const tipo = TIPO_POR_FORMULARIO[dados.formKey];
  if (!tipo) return { enviado: false, motivo: 'formulário sem correspondente no banco do agente' };

  const url = process.env.N8N_RETORNO_URL;
  const segredo = process.env.N8N_RETORNO_SECRET;
  if (!url || !segredo) return { enviado: false, motivo: 'retorno ao n8n não configurado' };

  const agendamentoId = await agendamentoDeOrigem(supabase, dados);
  if (!agendamentoId) return { enviado: false, motivo: 'visita sem agendamento de origem' };

  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 8000);
  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-retorno-secret': segredo },
      body: JSON.stringify({ agendamento_id: agendamentoId, tipo, respostas: dados.respostas }),
      signal: controle.signal,
    });
    if (!resposta.ok) {
      console.error('[retorno-agente] n8n respondeu', resposta.status, await resposta.text().catch(() => ''));
      return { enviado: false, motivo: `n8n respondeu ${resposta.status}` };
    }
    return { enviado: true };
  } catch (erro) {
    console.error('[retorno-agente] falha ao avisar o n8n', erro);
    return { enviado: false, motivo: 'falha de rede' };
  } finally {
    clearTimeout(limite);
  }
}
