import { describe, expect, it } from 'vitest';
import type { Activity, Deal } from '@/types';
import { countStalledDeals, getActivityStats, plural } from './sidebarStats';

const now = new Date(2026, 9, 18, 10, 0);
const at = (d: number, h: number) => new Date(2026, 9, d, h).toISOString();
const act = (over: Partial<Activity>): Activity => ({
  id: Math.random().toString(36), dealId: 'd', dealTitle: '', type: 'TASK', title: 't',
  date: at(18, 15), user: { name: '', avatar: '' }, completed: false, ...over,
});

describe('getActivityStats', () => {
  it('separa reuniões e tarefas de hoje e conta as atrasadas', () => {
    const stats = getActivityStats([
      act({ type: 'MEETING', date: at(18, 14) }),
      act({ type: 'CALL', date: at(18, 9) }), // hoje, já passou da hora, ainda conta como de hoje
      act({ type: 'TASK', date: at(18, 16) }),
      act({ type: 'EMAIL', date: at(17, 10) }), // atrasada
      act({ type: 'TASK', date: at(19, 10) }), // amanhã, fora
      act({ type: 'TASK', date: at(16, 10), completed: true }), // concluída, fora
      act({ type: 'NOTE', date: at(17, 10) }), // nota, fora
    ], now);
    expect(stats).toEqual({ todayAppointments: 2, todayTasks: 1, todayTotal: 3, overdue: 1 });
  });
});

describe('countStalledDeals', () => {
  const deal = (over: Partial<Deal>) => ({ isWon: false, isLost: false, createdAt: at(1, 10), ...over }) as Deal;
  it('conta abertos sem mudar de etapa há mais de 10 dias', () => {
    expect(countStalledDeals([
      deal({ lastStageChangeDate: at(5, 10) }), // parado
      deal({ lastStageChangeDate: at(15, 10) }), // mexeu há 3 dias
      deal({}), // sem mudança de etapa: usa a criação (dia 1), parado
      deal({ isWon: true }), // ganho, fora
      deal({ isLost: true }), // perdido, fora
    ], now)).toBe(2);
  });
});

describe('plural', () => {
  it('usa singular só para 1', () => {
    expect(plural(1, 'reunião', 'reuniões')).toBe('1 reunião');
    expect(plural(0, 'reunião', 'reuniões')).toBe('0 reuniões');
  });
});
