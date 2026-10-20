import { describe, expect, it } from 'vitest';
import { officeDateParts } from './brTime';

describe('officeDateParts', () => {
  it('converte o instante para o horário de Brasília', () => {
    // 01:30 UTC de 21/10 = 22:30 de 20/10 em Brasília
    expect(officeDateParts('2026-10-21T01:30:00Z')).toEqual({ year: 2026, month: 9, day: 20, hour: 22 });
  });

  it('meio-dia em Brasília continua meio-dia', () => {
    expect(officeDateParts('2026-10-20T15:00:00Z')).toEqual({ year: 2026, month: 9, day: 20, hour: 12 });
  });

  it('meia-noite vira hora 0', () => {
    expect(officeDateParts('2026-10-20T03:00:00Z').hour).toBe(0);
  });
});
