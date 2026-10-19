import { describe, expect, it } from 'vitest';
import type { Activity } from '@/types';
import { getNextAppointment } from './nextAppointment';

const now = new Date(2026, 9, 18, 10, 0); // 18/10/2026 10:00 (hora local)
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString();
const act = (over: Partial<Activity>): Activity => ({
  id: Math.random().toString(36), dealId: 'd1', dealTitle: 'Contrato Marcos', type: 'MEETING', title: 'Consulta',
  date: at(18, 14, 30), user: { name: 'Alex', avatar: '' }, completed: false, ...over,
});

describe('getNextAppointment', () => {
  it('pega a reunião ou ligação mais próxima a partir de agora', () => {
    const next = getNextAppointment([
      act({ title: 'Depois', date: at(19, 9) }),
      act({ title: 'Primeira', date: at(18, 14, 30) }),
      act({ title: 'Ligar', type: 'CALL', date: at(20, 8) }),
    ], now);
    expect(next).toEqual({
      day: 'hoje', when: 'Hoje', month: 'OUT', dayOfMonth: '18',
      time: '14:30', title: 'Reunião · Primeira', dealTitle: 'Contrato Marcos',
    });
  });

  it('ignora concluídas, passadas e tarefas que não são compromisso', () => {
    const next = getNextAppointment([
      act({ title: 'Feita', completed: true }),
      act({ title: 'Passou', date: at(18, 9) }),
      act({ title: 'Tarefa', type: 'TASK' }),
      act({ title: 'Ligar cliente', type: 'CALL', date: at(19, 11, 5) }),
    ], now);
    expect(next).toMatchObject({ day: 'amanhã', when: 'Amanhã', dayOfMonth: '19', time: '11:05', title: 'Ligação · Ligar cliente' });
  });

  it('mostra a data como DD.MM depois de amanhã', () => {
    expect(getNextAppointment([act({ date: at(25, 16) })], now)).toMatchObject({ day: '25.10', when: 'Dom', month: 'OUT', dayOfMonth: '25' });
  });

  it('sem compromisso futuro, devolve undefined', () => {
    expect(getNextAppointment([act({ date: at(17, 16) })], now)).toBeUndefined();
  });
});
