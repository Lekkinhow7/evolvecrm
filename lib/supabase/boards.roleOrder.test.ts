import { describe, it, expect, vi } from 'vitest';
import { clearMovedStageRoles, restoreStageRoles } from './boards';

/** Cliente falso que registra as chamadas em ordem. */
function fakeClient(existing: Array<{ id: string; role: string | null }>) {
  const calls: Array<{ op: string; payload?: unknown; ids?: string[]; id?: string }> = [];
  const eqs: Array<[string, unknown]> = [];
  const client: any = {
    from: () => ({
      select: () => {
        const chain: any = {
          eq: (col: string, val: unknown) => {
            eqs.push([col, val]);
            return col === 'organization_id' ? Promise.resolve({ data: existing, error: null }) : chain;
          },
        };
        return chain;
      },
      update: (payload: unknown) => {
        const chain: any = {
          eq: (col: string, val: unknown) => {
            eqs.push([col, val]);
            if (col === 'id') {
              calls.push({ op: 'update', payload, id: val as string });
              return Promise.resolve({ error: null });
            }
            return chain;
          },
          in: (_col: string, ids: string[]) => {
            calls.push({ op: 'update', payload, ids });
            return Promise.resolve({ error: null });
          },
        };
        return chain;
      },
    }),
  };
  return { client, calls, eqs };
}

const st = (id: string, role?: any) => ({ id, label: id, color: 'c', role });

describe('clearMovedStageRoles', () => {
  it('limpa o papel da etapa antiga quando o papel vai para outra etapa', async () => {
    const { client, calls } = fakeClient([{ id: 'a', role: 'reuniao_agendada' }, { id: 'b', role: null }]);
    const r = await clearMovedStageRoles(client, 'board1', 'org1', [st('a'), st('b', 'reuniao_agendada')]);
    expect(r.error).toBeNull();
    expect(calls).toEqual([{ op: 'update', payload: { role: null }, ids: ['a'] }]);
    expect(r.cleared).toEqual([{ id: 'a', role: 'reuniao_agendada' }]);
  });

  it('não mexe em etapa cujo papel não mudou', async () => {
    const { client, calls } = fakeClient([{ id: 'a', role: 'analise_documentos' }]);
    await clearMovedStageRoles(client, 'board1', 'org1', [st('a', 'analise_documentos')]);
    expect(calls).toEqual([]);
  });

  it('etapa removida com papel que outra etapa assume é limpa antes', async () => {
    const { client, calls } = fakeClient([{ id: 'a', role: 'reuniao_agendada' }, { id: 'b', role: null }]);
    await clearMovedStageRoles(client, 'board1', 'org1', [st('b', 'reuniao_agendada')]);
    expect(calls).toEqual([{ op: 'update', payload: { role: null }, ids: ['a'] }]);
  });

  it('etapa nova assumindo o papel de uma removida limpa a removida', async () => {
    const { client, calls } = fakeClient([{ id: 'a', role: 'analise_documentos' }]);
    await clearMovedStageRoles(client, 'board1', 'org1', [st('novo', 'analise_documentos')]);
    expect(calls).toEqual([{ op: 'update', payload: { role: null }, ids: ['a'] }]);
  });

  it('etapa removida cujo papel ninguém assume não é tocada', async () => {
    const { client, calls } = fakeClient([{ id: 'x', role: 'reuniao_agendada' }]);
    await clearMovedStageRoles(client, 'board1', 'org1', [st('y')]);
    expect(calls).toEqual([]);
  });

  it('filtra por organização no select e no update', async () => {
    const { client, eqs } = fakeClient([{ id: 'a', role: 'reuniao_agendada' }]);
    await clearMovedStageRoles(client, 'board1', 'org1', [st('b', 'reuniao_agendada')]);
    expect(eqs.filter(([c]) => c === 'organization_id')).toEqual([['organization_id', 'org1'], ['organization_id', 'org1']]);
  });
});

describe('restoreStageRoles', () => {
  it('devolve os papéis limpos', async () => {
    const { client, calls } = fakeClient([]);
    await restoreStageRoles(client, 'org1', [{ id: 'a', role: 'reuniao_agendada' }]);
    expect(calls).toEqual([{ op: 'update', payload: { role: 'reuniao_agendada' }, id: 'a' }]);
  });

  it('erro na restauração só é registrado, não lança', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const client: any = {
      from: () => ({ update: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: new Error('x') }) }) }) }),
    };
    await expect(restoreStageRoles(client, 'org1', [{ id: 'a', role: 'r' }])).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
