import type { Activity } from '@/types';

/** Tipos de atividade que contam como compromisso com hora marcada. */
const APPOINTMENT_TYPES: Activity['type'][] = ['MEETING', 'CALL'];
const TYPE_LABEL: Partial<Record<Activity['type'], string>> = { MEETING: 'Reunião', CALL: 'Ligação' };

export interface NextAppointment {
  /** "hoje", "amanhã" ou a data no formato DD.MM */
  day: string;
  /** Hora no formato HH:MM */
  time: string;
  /** Tipo e título, ex.: "Reunião · Consulta inicial" */
  title: string;
  /** Negócio ligado ao compromisso, quando existe */
  dealTitle?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Próxima reunião ou ligação não concluída, a partir de agora. */
export function getNextAppointment(activities: Activity[], now: Date = new Date()): NextAppointment | undefined {
  const next = activities
    .filter((a) => !a.completed && APPOINTMENT_TYPES.includes(a.type) && new Date(a.date).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  if (!next) return undefined;

  const when = new Date(next.date);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const day = sameDay(when, now) ? 'hoje' : sameDay(when, tomorrow) ? 'amanhã' : `${pad(when.getDate())}.${pad(when.getMonth() + 1)}`;
  const kind = TYPE_LABEL[next.type];

  return {
    day,
    time: `${pad(when.getHours())}:${pad(when.getMinutes())}`,
    title: kind ? `${kind} · ${next.title}` : next.title,
    dealTitle: next.dealTitle || undefined,
  };
}
