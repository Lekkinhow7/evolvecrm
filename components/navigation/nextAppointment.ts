import type { Activity } from '@/types';

/** Tipos de atividade que contam como compromisso com hora marcada. */
const APPOINTMENT_TYPES: Activity['type'][] = ['MEETING', 'CALL'];
const TYPE_LABEL: Partial<Record<Activity['type'], string>> = { MEETING: 'Reunião', CALL: 'Ligação' };

export interface NextAppointment {
  /** "hoje", "amanhã" ou a data no formato DD.MM */
  day: string;
  /** "Hoje", "Amanhã" ou o dia da semana abreviado ("Qua"), para o cartão do menu */
  when: string;
  /** Mês abreviado em maiúsculas ("OUT") e dia do mês ("20"), para o quadradinho de data */
  month: string;
  dayOfMonth: string;
  /** Hora no formato HH:MM */
  time: string;
  /** Tipo e título, ex.: "Reunião · Consulta inicial" */
  title: string;
  /** Negócio ligado ao compromisso, quando existe */
  dealTitle?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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
  const isToday = sameDay(when, now);
  const isTomorrow = sameDay(when, tomorrow);
  const day = isToday ? 'hoje' : isTomorrow ? 'amanhã' : `${pad(when.getDate())}.${pad(when.getMonth() + 1)}`;
  const kind = TYPE_LABEL[next.type];

  return {
    day,
    when: isToday ? 'Hoje' : isTomorrow ? 'Amanhã' : WEEKDAYS[when.getDay()],
    month: MONTHS[when.getMonth()],
    dayOfMonth: String(when.getDate()),
    time: `${pad(when.getHours())}:${pad(when.getMinutes())}`,
    title: kind ? `${kind} · ${next.title}` : next.title,
    dealTitle: next.dealTitle || undefined,
  };
}
