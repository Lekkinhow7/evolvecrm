/**
 * @fileoverview Conversa da ficha da call com o banco do agente, via n8n.
 *
 * Equipe, horários e agendamentos moram no banco do agente. A ficha pergunta ao
 * n8n quais técnicos existem e quem está livre, e pede a ele que grave a visita
 * e o resultado da call lá. Sem resposta do n8n a ficha não grava visita: uma
 * visita só no CRM não teria aviso nenhum para o técnico.
 *
 * @module lib/calls/n8n
 */

export type AcaoFicha = 'tecnicos' | 'agendar_visita' | 'resultado';

export class FichaN8nError extends Error {}

export async function chamarFichaNoN8n<T>(acao: AcaoFicha, dados: Record<string, unknown>): Promise<T> {
  const url = process.env.N8N_FICHA_CALL_URL;
  const segredo = process.env.N8N_RETORNO_SECRET;
  if (!url || !segredo) throw new FichaN8nError('Ligação da ficha com o n8n não configurada');

  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 15_000);
  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-retorno-secret': segredo },
      body: JSON.stringify({ acao, ...dados }),
      signal: controle.signal,
    });
    const texto = await resposta.text();
    if (!resposta.ok) {
      console.error('[ficha-call] n8n respondeu', resposta.status, texto.slice(0, 500));
      throw new FichaN8nError(`O n8n respondeu ${resposta.status}`);
    }
    try {
      return JSON.parse(texto) as T;
    } catch {
      throw new FichaN8nError('Resposta do n8n ilegível');
    }
  } catch (erro) {
    if (erro instanceof FichaN8nError) throw erro;
    console.error('[ficha-call] falha ao falar com o n8n', erro);
    throw new FichaN8nError('Sem resposta do n8n');
  } finally {
    clearTimeout(limite);
  }
}
