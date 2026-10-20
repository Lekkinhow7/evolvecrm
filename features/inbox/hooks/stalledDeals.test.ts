import { describe, expect, it } from 'vitest';
import type { DealView } from '@/types';
import { describeStalledDeal, isDealStalled, lastMovementTs } from './stalledDeals';

const DAY = 1000 * 60 * 60 * 24;
const now = Date.parse('2026-10-20T12:00:00Z');
const cutoff = now - 7 * DAY;
const iso = (ts: number) => new Date(ts).toISOString();

const deal = (over: Partial<DealView>) =>
  ({
    id: 'd1',
    title: 'WhatsApp',
    contactId: 'c1',
    contactName: 'Thalita Sá',
    stageLabel: 'Novo lead',
    value: 0,
    isWon: false,
    isLost: false,
    updatedAt: iso(now - 20 * DAY),
    ...over,
  }) as DealView;

describe('isDealStalled', () => {
  it('negócio sem edição e sem mensagem há mais de 7 dias está parado', () => {
    expect(isDealStalled(deal({}), new Map(), cutoff)).toBe(true);
  });

  it('contato que mandou mensagem esta semana não está parado', () => {
    const msgs = new Map([['c1', now - 2 * DAY]]);
    expect(isDealStalled(deal({}), msgs, cutoff)).toBe(false);
  });

  it('mensagem antiga não salva o negócio', () => {
    const msgs = new Map([['c1', now - 30 * DAY]]);
    expect(isDealStalled(deal({}), msgs, cutoff)).toBe(true);
  });

  it('negócio ganho ou perdido nunca está parado', () => {
    expect(isDealStalled(deal({ isWon: true }), new Map(), cutoff)).toBe(false);
    expect(isDealStalled(deal({ isLost: true }), new Map(), cutoff)).toBe(false);
  });

  it('último movimento é o mais recente entre edição e mensagem', () => {
    const msgs = new Map([['c1', now - 3 * DAY]]);
    expect(lastMovementTs(deal({}), msgs)).toBe(now - 3 * DAY);
  });
});

describe('describeStalledDeal', () => {
  it('sem valor, não mostra R$ 0 nem probabilidade', () => {
    expect(describeStalledDeal(deal({}))).toBe('Thalita Sá · Novo lead');
  });

  it('com valor, mostra o valor', () => {
    expect(describeStalledDeal(deal({ value: 1500 }))).toMatch(/^Thalita Sá · Novo lead · R\$\s1\.500$/);
  });

  it('sem nome do contato, usa o título do negócio', () => {
    expect(describeStalledDeal(deal({ contactName: '' }))).toBe('WhatsApp · Novo lead');
  });
});
