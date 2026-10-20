/**
 * @fileoverview Conversa da agenda com o banco do agente, via n8n.
 *
 * Horários livres e agendamentos moram no banco do agente (e no Google). O CRM
 * pergunta ao n8n quem está livre e pede a ele que grave, remarque ou cancele.
 * Sem resposta do n8n o CRM não grava nada: uma reunião só no CRM não teria
 * evento no Google nem aviso nenhum para o cliente.
 *
 * @module lib/agenda/n8n
 */

export type AcaoAgenda =
  | 'horarios_livres'
  | 'agendar_reuniao'
  | 'remarcar_reuniao'
  | 'cancelar_reuniao'
  | 'pedir_documentos'

export class AgendaN8nError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AgendaN8nError'
  }
}

export async function chamarAgendaNoN8n<T>(acao: AcaoAgenda, dados: Record<string, unknown>): Promise<T> {
  const url = process.env.N8N_AGENDA_URL
  const segredo = process.env.N8N_RETORNO_SECRET
  if (!url || !segredo) throw new AgendaN8nError('Ligação da agenda com o n8n não configurada')

  const controle = new AbortController()
  const limite = setTimeout(() => controle.abort(), 15_000)
  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-retorno-secret': segredo },
      body: JSON.stringify({ acao, ...dados }),
      signal: controle.signal,
    })
    const texto = await resposta.text()
    if (!resposta.ok) {
      console.error('[agenda] n8n respondeu', resposta.status, texto.slice(0, 500))
      throw new AgendaN8nError(`O n8n respondeu ${resposta.status}`)
    }
    try {
      return JSON.parse(texto) as T
    } catch {
      throw new AgendaN8nError('Resposta do n8n ilegível')
    }
  } catch (erro) {
    if (erro instanceof AgendaN8nError) throw erro
    console.error('[agenda] falha ao falar com o n8n', erro)
    throw new AgendaN8nError('Sem resposta do n8n')
  } finally {
    clearTimeout(limite)
  }
}
