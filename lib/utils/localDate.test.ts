import { describe, expect, it } from 'vitest';
import { toLocalDateInput } from './localDate';

describe('toLocalDateInput', () => {
  it('usa o dia local, mesmo perto da meia-noite', () => {
    expect(toLocalDateInput(new Date(2026, 9, 19, 23, 30))).toBe('2026-10-19');
    expect(toLocalDateInput(new Date(2026, 0, 5, 0, 5))).toBe('2026-01-05');
  });
});
