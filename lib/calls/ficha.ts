/**
 * @fileoverview Regras da ficha da call do vendedor.
 *
 * A call é uma reunião (activity MEETING) marcada pela Marina. Durante a call o
 * vendedor anota e, no fim, registra o resultado. "Agendar visita" cria a visita
 * no banco do agente (de onde saem os avisos) e no CRM, com o técnico que ele
 * escolheu. A lista de técnicos vem do banco do agente; o CRM só sugere.
 *
 * @module lib/calls/ficha
 */

import { z } from 'zod';

/** Duração da call quando ela não tem fim gravado. */
export const DURACAO_CALL_MIN = 60;

/** Duração padrão da visita técnica agendada na call. */
export const DURACAO_VISITA_MIN = 60;

export const RESULTADOS = ['agendar_visita', 'sem_interesse', 'retornar', 'nao_atendeu'] as const;
export type ResultadoCall = (typeof RESULTADOS)[number];

export const RESULTADO_LABEL: Record<ResultadoCall, string> = {
  agendar_visita: 'Agendar visita',
  sem_interesse: 'Sem interesse',
  retornar: 'Retornar depois',
  nao_atendeu: 'Não atendeu',
};

/** Mesmas chaves que o banco do agente aceita em motivo_recusa. */
export const MOTIVOS_SEM_INTERESSE = {
  preco: 'Preço',
  sem_urgencia: 'Sem urgência',
  concorrente: 'Fechou com concorrente',
  sem_verba: 'Sem verba',
  sem_resposta: 'Parou de responder',
  outro: 'Outro',
} as const;
export type MotivoSemInteresse = keyof typeof MOTIVOS_SEM_INTERESSE;

const PREFIXO_ORIGEM = 'sz-agendamento-';

/** Id do agendamento no banco do agente, tirado do external_ref da atividade. */
export function agendamentoDaAtividade(externalRef?: string | null): string | null {
  const ref = String(externalRef || '');
  return ref.startsWith(PREFIXO_ORIGEM) ? ref.slice(PREFIXO_ORIGEM.length) || null : null;
}

export function refDoAgendamento(agendamentoId: string | number): string {
  return `${PREFIXO_ORIGEM}${agendamentoId}`;
}

/** Fim da call: o gravado ou uma hora depois do início. */
export function fimDaCall(call: { date: string; endsAt?: string | null }): Date {
  if (call.endsAt) {
    const fim = new Date(call.endsAt);
    if (!Number.isNaN(fim.getTime())) return fim;
  }
  return new Date(new Date(call.date).getTime() + DURACAO_CALL_MIN * 60_000);
}

/**
 * Call de vendedor: reunião que veio da Marina (tem agendamento de origem) ou
 * que tem vendedor. Reunião comum do CRM não cobra resultado de ninguém.
 */
export function ehCallDeVendedor(call: { type: string; externalRef?: string | null; sellerRef?: string | null }): boolean {
  return call.type === 'MEETING' && Boolean(call.sellerRef || agendamentoDaAtividade(call.externalRef));
}

/** Call de vendedor que já terminou, não foi cancelada e ainda está sem resultado. */
export function callPendente(
  call: {
    type: string;
    date: string;
    endsAt?: string | null;
    callResult?: string | null;
    visitStatus?: string | null;
    externalRef?: string | null;
    sellerRef?: string | null;
  },
  agora: Date = new Date(),
): boolean {
  if (!ehCallDeVendedor(call)) return false;
  if (call.callResult) return false;
  if (call.visitStatus === 'cancelada') return false;
  return fimDaCall(call).getTime() <= agora.getTime();
}

export interface TecnicoDaLista {
  id: string;
  nome: string;
  livre: boolean;
  visitasSemana: number;
}

/**
 * Técnico que já vem marcado: o livre naquele horário com menos visitas na
 * semana. Empate fica com a ordem alfabética, para a sugestão não mudar a cada
 * vez que a ficha abre. Ninguém livre, ninguém sugerido.
 */
export function sugerirTecnico(lista: TecnicoDaLista[]): string | null {
  const livres = lista.filter((t) => t.livre);
  if (!livres.length) return null;
  const [melhor] = [...livres].sort(
    (a, b) => a.visitasSemana - b.visitasSemana || a.nome.localeCompare(b.nome, 'pt-BR'),
  );
  return melhor.id;
}

export const ResultadoSchema = z
  .object({
    resultado: z.enum(RESULTADOS),
    anotacoes: z.string().trim().max(5000).optional(),
    visita: z
      .object({
        inicio: z.string().min(10),
        duracaoMin: z.number().int().min(15).max(480).default(DURACAO_VISITA_MIN),
        endereco: z.string().trim().min(3).max(300),
        referencia: z.string().trim().max(300).optional(),
        tecnicoId: z.string().trim().min(1).max(60),
      })
      .optional(),
    motivo: z.enum(Object.keys(MOTIVOS_SEM_INTERESSE) as [MotivoSemInteresse, ...MotivoSemInteresse[]]).optional(),
    retornarEm: z.string().min(10).optional(),
  })
  .refine((v) => v.resultado !== 'agendar_visita' || Boolean(v.visita), {
    message: 'Para agendar a visita, informe dia, hora, endereço e técnico',
  })
  .refine((v) => v.resultado !== 'sem_interesse' || Boolean(v.motivo), {
    message: 'Informe o motivo',
  })
  .refine((v) => v.resultado !== 'retornar' || Boolean(v.retornarEm), {
    message: 'Informe quando retornar',
  })
  .refine((v) => !v.visita || !Number.isNaN(new Date(v.visita.inicio).getTime()), {
    message: 'Data da visita inválida',
  })
  .refine((v) => !v.retornarEm || !Number.isNaN(new Date(v.retornarEm).getTime()), {
    message: 'Data de retorno inválida',
  });

export type ResultadoInput = z.infer<typeof ResultadoSchema>;
