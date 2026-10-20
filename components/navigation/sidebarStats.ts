import type { Activity, Deal } from '@/types';

/** Reunião e ligação contam como compromisso. */
const APPOINTMENT_TYPES: Activity['type'][] = ['MEETING', 'CALL'];
/** Notas e mudanças de status são registro, não algo a fazer. */
const NOT_TODO_TYPES: Activity['type'][] = ['NOTE', 'STATUS_CHANGE'];

/** Anotação ou registro automático (mudança de etapa), não um item a fazer. */
export function isRecordActivity(a: Pick<Activity, 'type'>): boolean {
  return NOT_TODO_TYPES.includes(a.type);
}

export interface ActivityStats {
  /** Reuniões e ligações pendentes marcadas para hoje */
  todayAppointments: number;
  /** Tarefas (tipo Tarefa) pendentes para hoje — mesmo critério do filtro "Tarefas" da tela de Tarefas */
  todayTasks: number;
  /** Tudo o que está pendente para hoje (reuniões, ligações, tarefas, e-mails) */
  todayTotal: number;
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

  const stats: ActivityStats = { todayAppointments: 0, todayTasks: 0, todayTotal: 0, overdue: 0 };
  for (const a of activities) {
    if (a.completed || NOT_TODO_TYPES.includes(a.type)) continue;
    const ts = Date.parse(a.date);
    if (ts < todayTs) stats.overdue += 1;
    else if (ts < tomorrowTs) {
      stats.todayTotal += 1;
      if (APPOINTMENT_TYPES.includes(a.type)) stats.todayAppointments += 1;
      else if (a.type === 'TASK') stats.todayTasks += 1;
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
