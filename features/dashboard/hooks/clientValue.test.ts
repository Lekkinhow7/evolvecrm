import { describe, expect, it } from 'vitest';
import type { Deal } from '@/types';
import { averageWonValuePerClient } from './clientValue';

const deal = (over: Partial<Deal>) => ({ isWon: false, isLost: false, value: 0, contactId: 'c1', ...over }) as Deal;

describe('averageWonValuePerClient', () => {
  it('média dos negócios ganhos por cliente que já fechou', () => {
    expect(averageWonValuePerClient([
      deal({ contactId: 'c1', isWon: true, value: 3000 }),
      deal({ contactId: 'c1', isWon: true, value: 1000 }), // c1 rendeu 4000
      deal({ contactId: 'c2', isWon: true, value: 2000 }), // c2 rendeu 2000
      deal({ contactId: 'c3', value: 9000 }), // aberto, fora
      deal({ contactId: 'c4', isLost: true, value: 5000 }), // perdido, fora
    ])).toBe(3000);
  });

  it('sem negócio ganho, zero', () => {
    expect(averageWonValuePerClient([deal({ value: 500 })])).toBe(0);
  });

  it('negócio ganho sem contato conta como um cliente à parte', () => {
    expect(averageWonValuePerClient([
      deal({ contactId: '', isWon: true, value: 1000 }),
      deal({ contactId: 'c1', isWon: true, value: 3000 }),
    ])).toBe(2000);
  });
});
