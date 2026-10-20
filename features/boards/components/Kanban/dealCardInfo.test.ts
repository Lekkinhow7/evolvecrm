import { describe, expect, it } from 'vitest';
import type { Activity } from '@/types';
import { daysInStage, dealSubject, formatMeetingShort, formatPhoneBR, nextMeetingByDeal } from './dealCardInfo';

describe('dealSubject', () => {
  it('negócio do WhatsApp não tem assunto', () => {
    expect(dealSubject({ title: 'Denise - WhatsApp', contactName: 'Denise' })).toBe('');
  });
  it('negócio do site traz o assunto entre parênteses', () => {
    expect(dealSubject({ title: 'Jefferson Henrique (Fraude bancária)', contactName: 'Jefferson Henrique' })).toBe('Fraude bancária');
  });
  it('título sem o nome do contato vira o assunto', () => {
    expect(dealSubject({ title: 'Revisão de aposentadoria', contactName: 'Maria' })).toBe('Revisão de aposentadoria');
  });
  it('título igual ao nome não repete', () => {
    expect(dealSubject({ title: 'Maria', contactName: 'Maria' })).toBe('');
  });
});

describe('formatPhoneBR', () => {
  it('celular com 9', () => expect(formatPhoneBR('+5571991950019')).toBe('(71) 99195-0019'));
  it('número sem o 9', () => expect(formatPhoneBR('+557188417064')).toBe('(71) 8841-7064'));
  it('vazio', () => expect(formatPhoneBR('')).toBe(''));
});

describe('daysInStage', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');
  it('usa a última mudança de etapa', () => {
    expect(daysInStage({ lastStageChangeDate: '2026-10-17T12:00:00Z', createdAt: '2026-10-01T00:00:00Z' }, now)).toBe(3);
  });
  it('sem mudança, usa a criação', () => {
    expect(daysInStage({ createdAt: '2026-10-10T12:00:00Z' }, now)).toBe(10);
  });
});

describe('nextMeetingByDeal', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');
  const meeting = (over: Partial<Activity>) =>
    ({ id: Math.random().toString(), type: 'MEETING', dealId: 'd1', completed: false, date: '2026-10-22T17:00:00Z', ...over }) as Activity;
  it('pega a reunião futura mais próxima e ignora passadas, concluídas e canceladas', () => {
    const map = nextMeetingByDeal([
      meeting({ date: '2026-10-25T17:00:00Z' }),
      meeting({ date: '2026-10-22T17:00:00Z' }),
      meeting({ date: '2026-10-19T17:00:00Z' }),
      meeting({ date: '2026-10-21T17:00:00Z', completed: true }),
      meeting({ date: '2026-10-21T13:00:00Z', meetingStatus: 'cancelada' }),
    ], now);
    expect(map.get('d1')).toBe('2026-10-22T17:00:00Z');
  });
});

describe('formatMeetingShort', () => {
  it('dia da semana e hora em Brasília', () => {
    // 17:00 UTC de quinta 22/10 = 14:00 em Brasília
    expect(formatMeetingShort('2026-10-22T17:00:00Z')).toBe('Qui 14:00');
  });
});
