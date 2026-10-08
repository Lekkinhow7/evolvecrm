'use client';

/**
 * @fileoverview Aviso no topo do CRM quando há call terminada sem resultado.
 *
 * É o lembrete de dentro do sistema: o vendedor vê assim que abre o CRM, antes
 * da cobrança chegar no WhatsApp. O clique abre a ficha da call mais antiga.
 */

import React, { useEffect, useState } from 'react';

import { useActivities } from '@/lib/query/hooks/useActivitiesQuery';
import { callPendente } from '@/lib/calls/ficha';

export function CallsPendentesAviso() {
  const { data: atividades = [] } = useActivities();
  // Reavalia a cada minuto: a call que termina agora passa a contar sem recarregar.
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const pendentes = atividades
    .filter((a) => callPendente(a, agora))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (!pendentes.length) return null;

  const texto =
    pendentes.length === 1 ? 'Você tem 1 call sem resultado' : `Você tem ${pendentes.length} calls sem resultado`;

  return (
    <a
      href={`/activities?atividade=${pendentes[0].id}`}
      className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm hover:bg-red-100 dark:border-red-500/20 dark:bg-red-900/20 dark:text-red-300"
    >
      <span>⚠️ {texto}</span>
      <span className="font-medium">Registrar agora →</span>
    </a>
  );
}
