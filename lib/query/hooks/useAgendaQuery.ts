/**
 * Hooks da agenda: horários livres (vindos do n8n pela rota interna) e
 * ações sobre reuniões (marcar, remarcar, cancelar, mudar situação).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, DEALS_VIEW_KEY } from '../index';
import type { DealView } from '@/types';

export interface FreeSlot {
  inicio: string;
  fim: string;
  formato?: 'online' | 'presencial';
}

export type MeetingFormat = 'online' | 'presencial';

export type MeetingUpdate =
  | { id: string; acao: 'remarcar'; inicio: string; fim: string; formato?: MeetingFormat; pedido_id?: string }
  | { id: string; acao: 'cancelar' }
  | { id: string; acao: 'status'; status: 'realizada' | 'nao_compareceu' };

/**
 * Resposta das rotas que passam pelo n8n. `pendente`: o n8n marcou mas o CRM
 * ainda não registrou (código MARCADA_SEM_REGISTRO); não tentar de novo.
 */
export interface RespostaAgenda {
  ok: boolean;
  pendente?: boolean;
  code?: string;
}

/** Erro de rota da agenda, com o código devolvido pela API (ex.: HORARIO_OCUPADO). */
export class AgendaApiError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AgendaApiError';
    this.status = status;
    this.code = code;
  }
}

async function lerResposta<T>(res: Response): Promise<T> {
  const corpo = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new AgendaApiError(
      typeof corpo.error === 'string' ? corpo.error : 'Erro na agenda',
      res.status,
      typeof corpo.code === 'string' ? corpo.code : undefined,
    );
  }
  return corpo as T;
}

export const useFreeSlots = (enabled: boolean) =>
  useQuery({
    queryKey: [...queryKeys.activities.all, 'free-slots'] as const,
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    queryFn: async (): Promise<FreeSlot[]> => {
      const res = await fetch('/api/agenda/horarios-livres?dias=14');
      const corpo = await lerResposta<{ horarios?: FreeSlot[] }>(res);
      return Array.isArray(corpo.horarios) ? corpo.horarios : [];
    },
  });

export const useScheduleMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { deal_id: string; inicio: string; fim: string; formato: MeetingFormat; pedido_id?: string }) => {
      const res = await fetch('/api/agenda/reunioes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return lerResposta<RespostaAgenda & { reuniao_id?: string }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
};

export const useUpdateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...corpo }: MeetingUpdate) => {
      const res = await fetch(`/api/agenda/reunioes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      return lerResposta<RespostaAgenda>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
};

/** Pede mais documentos ao cliente (n8n) e marca o negócio como "aguardando documentos". */
export const usePedirDocumentos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dealId: string) => {
      const res = await fetch('/api/agenda/pedir-documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal_id: dealId }),
      });
      return lerResposta<{ ok: boolean }>(res);
    },
    onSuccess: (_data, dealId) => {
      queryClient.setQueryData<DealView[]>(DEALS_VIEW_KEY, (old) =>
        old?.map((d) => (d.id === dealId ? { ...d, awaitingDocuments: true } : d)),
      );
    },
  });
};
