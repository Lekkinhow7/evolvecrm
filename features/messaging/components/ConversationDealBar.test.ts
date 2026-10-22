import { describe, expect, it } from 'vitest';
import type { DealView } from '@/types';
import { pickContactDeal } from './ConversationDealBar';

const deal = (over: Partial<DealView>) =>
  ({ id: 'd', contactId: 'c1', isWon: false, isLost: false, updatedAt: '2026-10-01T00:00:00Z', ...over }) as DealView;

describe('pickContactDeal', () => {
  it('sem contato, nenhum negócio', () => {
    expect(pickContactDeal([deal({})], null)).toBeUndefined();
  });

  it('prefere o negócio aberto mais recente do contato', () => {
    const picked = pickContactDeal([
      deal({ id: 'velho', updatedAt: '2026-09-01T00:00:00Z' }),
      deal({ id: 'ganho', isWon: true, updatedAt: '2026-10-20T00:00:00Z' }),
      deal({ id: 'novo', updatedAt: '2026-10-10T00:00:00Z' }),
      deal({ id: 'outro', contactId: 'c2', updatedAt: '2026-10-21T00:00:00Z' }),
    ], 'c1');
    expect(picked?.id).toBe('novo');
  });

  it('sem negócio aberto, mostra o mais recente (fechado)', () => {
    expect(pickContactDeal([deal({ id: 'ganho', isWon: true })], 'c1')?.id).toBe('ganho');
  });
});
