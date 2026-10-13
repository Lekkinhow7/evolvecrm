'use client';

/**
 * Estado do agente de IA na conversa (só no número da uazapi, onde o agente atende)
 * e os botões para pausar e devolver o atendimento.
 * - ativo: o agente responde normalmente;
 * - pausado: um consultor falou com o cliente; volta 5 minutos depois da última fala dele;
 * - pausado_sem_prazo: alguém pausou pelo botão; só volta quando devolverem.
 */

import React, { useEffect, useState } from 'react';
import { Bot, Pause, Play } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/query';
import type { ConversationView } from '@/lib/messaging/types';

type EstadoAgente = { modo?: string; ate?: string | null };

interface AgenteControleProps {
  conversation: ConversationView;
}

export function AgenteControle({ conversation }: AgenteControleProps) {
  const queryClient = useQueryClient();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  // Atualiza a contagem da pausa de 5 minutos.
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  if (conversation.channelProvider !== 'uazapi') return null;

  const nome = conversation.agentName || 'o agente';
  const estado = ((conversation.metadata as Record<string, unknown> | undefined)?.agente || {}) as EstadoAgente;
  const ate = estado.ate ? new Date(estado.ate).getTime() : 0;
  const semPrazo = estado.modo === 'pausado_sem_prazo';
  const pausaCurta = estado.modo === 'pausado' && ate > agora;
  const pausado = semPrazo || pausaCurta;
  const minutos = pausaCurta ? Math.max(1, Math.ceil((ate - agora) / 60_000)) : 0;

  const rotulo = semPrazo
    ? `${nome} pausada`
    : pausaCurta
      ? `${nome} volta em ${minutos} min`
      : `${nome} atendendo`;

  async function enviar(acao: 'pausar' | 'devolver') {
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch(`/api/messaging/conversations/${conversation.id}/agente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao }),
      });
      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        throw new Error(corpo?.error || 'Não deu certo, tente de novo');
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.messagingConversations.all });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu certo, tente de novo');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
          pausado
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
            : 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
        )}
        title={erro || undefined}
      >
        <Bot className="w-3.5 h-3.5" />
        {rotulo}
      </span>
      {semPrazo || pausaCurta ? (
        <button
          type="button"
          disabled={enviando}
          onClick={() => enviar('devolver')}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-500/10 disabled:opacity-50 transition-colors"
          title={`Devolver para ${nome}: volta a responder agora e responde o que ficou sem resposta`}
        >
          <Play className="w-4 h-4" />
          <span className="hidden lg:inline">Devolver para {nome}</span>
        </button>
      ) : null}
      {!semPrazo ? (
        <button
          type="button"
          disabled={enviando}
          onClick={() => enviar('pausar')}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
          title={`Pausar ${nome} neste cliente até alguém devolver`}
        >
          <Pause className="w-4 h-4" />
          <span className="hidden lg:inline">Pausar {nome}</span>
        </button>
      ) : null}
      {erro ? <span className="text-xs text-red-500 max-w-[10rem] truncate" title={erro}>{erro}</span> : null}
    </div>
  );
}
