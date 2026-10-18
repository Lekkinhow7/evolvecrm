import type { Activity, Deal } from '@/types';

/** Reunião e ligação contam como compromisso; o resto (tarefa, e-mail…) como tarefa. */
const APPOINTMENT_TYPES: Activity['type'][] = ['MEETING', 'CALL'];
/** Notas e mudanças de status são registro, não algo a fazer. */
const NOT_TODO_TYPES: Activity['type'][] = ['NOTE', 'STATUS_CHANGE'];

export interface ActivityStats {
  /** Reuniões e ligações pendentes marcadas para hoje */
  todayAppointments: number;
  /** Demais tarefas pendentes para hoje */
  todayTasks: number;
  /** Pendentes com data antes de hoje (mesma regra do filtro "Atrasadas" das Tarefas) */
  overdue: number;
}

export function getActivityStats(activities: Activity[], now: Date = new Date()): ActivityStats {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const todayTs = today.getTime();
  const tomorrowTs = tomorrow.getTime();

  const stats: ActivityStats = { todayAppointments: 0, todayTasks: 0, overdue: 0 };
  for (const a of activities) {
    if (a.completed || NOT_TODO_TYPES.includes(a.type)) continue;
    const ts = Date.parse(a.date);
    if (ts < todayTs) stats.overdue += 1;
    else if (ts < tomorrowTs) {
      if (APPOINTMENT_TYPES.includes(a.type)) stats.todayAppointments += 1;
      else stats.todayTasks += 1;
    }
  }
  return stats;
}

/** Negócios abertos sem mudar de etapa há mais de 10 dias (mesma regra da Visão geral). */
export function countStalledDeals(deals: Deal[], now: Date = new Date()): number {
  const tenDaysAgoTs = now.getTime() - 10 * 24 * 60 * 60 * 1000;
  let count = 0;
  for (const deal of deals) {
    if (deal.isWon || deal.isLost) continue;
    const lastChangeTs = deal.lastStageChangeDate ? Date.parse(deal.lastStageChangeDate) : Date.parse(deal.createdAt);
    if (lastChangeTs < tenDaysAgoTs) count += 1;
  }
  return count;
}

/** "2 reuniões", "1 tarefa"… */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
