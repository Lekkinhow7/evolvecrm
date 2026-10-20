'use client';

import React, { useMemo } from 'react';
import { Button } from '@/design-system';
import type { FreeSlot } from '@/lib/query/hooks/useAgendaQuery';

const TZ = 'America/Sao_Paulo';

const diaFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'short', day: '2-digit', month: '2-digit' });
const chaveFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const horaFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });

/** "Seg, 20/10" no fuso de São Paulo. */
export function rotuloDoDia(iso: string): string {
  const p = Object.fromEntries(diaFmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  const sem = String(p.weekday || '').replace('.', '');
  return `${sem.charAt(0).toUpperCase()}${sem.slice(1)}, ${p.day}/${p.month}`;
}

export const horaDoSlot = (iso: string) => horaFmt.format(new Date(iso));

export function agruparPorDia(slots: FreeSlot[]): { dia: string; rotulo: string; slots: FreeSlot[] }[] {
  const mapa = new Map<string, { dia: string; rotulo: string; slots: FreeSlot[] }>();
  for (const s of slots) {
    const dia = chaveFmt.format(new Date(s.inicio));
    const g = mapa.get(dia) ?? { dia, rotulo: rotuloDoDia(s.inicio), slots: [] };
    g.slots.push(s);
    mapa.set(dia, g);
  }
  return [...mapa.values()].sort((a, b) => a.dia.localeCompare(b.dia));
}

interface Props {
  slots: FreeSlot[];
  selecionado: FreeSlot | null;
  onSelect: (slot: FreeSlot) => void;
}

/** Lista de horários livres agrupados por dia. */
export const HorariosLivres: React.FC<Props> = ({ slots, selecionado, onSelect }) => {
  const grupos = useMemo(() => agruparPorDia(slots), [slots]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {grupos.map((g) => (
        <div key={g.dia}>
          <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>{g.rotulo}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {g.slots.map((s) => (
              <Button
                key={s.inicio}
                size="sm"
                variant={selecionado?.inicio === s.inicio ? 'primary' : 'secondary'}
                onClick={() => onSelect(s)}
              >
                {horaDoSlot(s.inicio)}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
