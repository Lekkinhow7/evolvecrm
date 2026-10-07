/**
 * @fileoverview Envio de conversões pela API de Conversões da Meta (CAPI).
 *
 * O pixel no navegador perde parte dos leads (bloqueador de anúncio, iPhone).
 * O servidor manda o mesmo evento com o mesmo event_id: a Meta junta os dois e
 * conta uma vez só. Sem META_PIXEL_ID e META_CAPI_TOKEN nada é enviado.
 *
 * @module lib/meta/capi
 */

import { createHash } from 'node:crypto';

const VERSAO_API = 'v21.0';

function embaralhar(valor: string): string {
  return createHash('sha256').update(valor.trim().toLowerCase()).digest('hex');
}

export interface DadosDoEvento {
  nome: 'Lead' | 'Contact';
  eventId: string;
  quando: Date;
  pagina?: string | null;
  /** Só dígitos, com o 55 na frente. */
  telefone?: string | null;
  primeiroNome?: string | null;
  ip?: string | null;
  navegador?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  extras?: Record<string, string | null | undefined>;
}

/** Monta um evento no formato da Meta. Dados pessoais vão embaralhados. */
export function montarEvento(d: DadosDoEvento): Record<string, unknown> {
  const usuario: Record<string, unknown> = { country: [embaralhar('br')] };
  const tel = (d.telefone || '').replace(/\D/g, '');
  if (tel) usuario.ph = [embaralhar(tel)];
  const nome = (d.primeiroNome || '').trim().split(/\s+/)[0];
  if (nome) usuario.fn = [embaralhar(nome)];
  if (d.ip) usuario.client_ip_address = d.ip;
  if (d.navegador) usuario.client_user_agent = d.navegador;
  if (d.fbp) usuario.fbp = d.fbp;
  if (d.fbc) usuario.fbc = d.fbc;

  const extras = Object.fromEntries(
    Object.entries(d.extras || {}).filter(([, v]) => v !== null && v !== undefined && v !== ''),
  );

  return {
    event_name: d.nome,
    event_time: Math.floor(d.quando.getTime() / 1000),
    event_id: d.eventId,
    action_source: 'website',
    ...(d.pagina ? { event_source_url: d.pagina } : {}),
    user_data: usuario,
    ...(Object.keys(extras).length ? { custom_data: extras } : {}),
  };
}

/** Manda os eventos. Falha não derruba quem chamou: só fica no log. */
export async function enviarParaMeta(eventos: Record<string, unknown>[]): Promise<{ enviado: boolean; motivo?: string }> {
  const pixel = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return { enviado: false, motivo: 'API de Conversões não configurada' };
  if (!eventos.length) return { enviado: false, motivo: 'nada para enviar' };

  const corpo: Record<string, unknown> = { data: eventos, access_token: token };
  if (process.env.META_CAPI_TEST_CODE) corpo.test_event_code = process.env.META_CAPI_TEST_CODE;

  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 6000);
  try {
    const resposta = await fetch(`https://graph.facebook.com/${VERSAO_API}/${pixel}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      signal: controle.signal,
    });
    if (!resposta.ok) {
      console.error('[meta-capi] Meta respondeu', resposta.status, (await resposta.text().catch(() => '')).slice(0, 300));
      return { enviado: false, motivo: `Meta respondeu ${resposta.status}` };
    }
    return { enviado: true };
  } catch (erro) {
    console.error('[meta-capi] falha ao enviar', erro);
    return { enviado: false, motivo: 'falha de rede' };
  } finally {
    clearTimeout(limite);
  }
}
