import { describe, it, expect, vi } from 'vitest';

const log: string[] = [];
const ORG = '11111111-1111-4111-8111-111111111111';

vi.mock('./client', () => {
  const thenable = (result: any) => {
    const c: any = {
      eq: () => c,
      in: () => c,
      not: () => c,
      maybeSingle: () => Promise.resolve({ data: { organization_id: ORG }, error: null }),
      then: (res: any, rej: any) => Promise.resolve(result).then(res, rej),
    };
    return c;
  };
  return {
    supabase: {
      from: (table: string) => ({
        select: () => (table === 'board_stages'
          ? thenable({ data: [{ id: 'a', role: 'reuniao_agendada' }], error: null })
          : thenable({ data: null, error: null })),
        update: (payload: any) => {
          log.push(`update ${table} ${JSON.stringify(payload)}`);
          return thenable({ error: null });
        },
        upsert: () => {
          log.push(`upsert ${table}`);
          return Promise.resolve({ error: new Error('boom') });
        },
        delete: () => thenable({ error: null }),
      }),
    },
  };
});

import { boardsService } from './boards';

describe('boardsService.update', () => {
  it('se o upsert falha, restaura os papéis que limpou', async () => {
    log.length = 0;
    const { error } = await boardsService.update('b1', {
      stages: [{ id: 'b', label: 'B', color: 'c', role: 'reuniao_agendada' }],
    });
    expect(error?.message).toBe('boom');
    const stageLog = log.filter((l) => l.includes('board_stages'));
    expect(stageLog).toEqual([
      'update board_stages {"role":null}',
      'upsert board_stages',
      'update board_stages {"role":"reuniao_agendada"}',
    ]);
  });
});
