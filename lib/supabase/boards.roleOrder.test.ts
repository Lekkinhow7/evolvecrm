import { describe, it, expect } from 'vitest';
import { clearMovedStageRoles } from './boards';

/** Cliente falso que registra as chamadas em ordem. */
function fakeClient(existing: Array<{ id: string; role: string | null }>) {
  const calls: Array<{ op: string; payload?: unknown; ids?: string[] }> = [];
  const client: any = {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: existing, error: null }),
      }),
      update: (payload: unknown) => ({
        in: (_col: string, ids: string[]) => {
          calls.push({ op: 'update', payload, ids });
          return Promise.resolve({ error: null });
        },
      }),
    }),
  };
  return { client, calls };
}

describe('clearMovedStageRoles', () => {
  it('limpa o papel da etapa antiga quando o papel vai para outra etapa', async () => {
    const { client, calls } = fakeClient([
      { id: 'a', role: 'reuniao_agendada' },
      { id: 'b', role: null },
    ]);
    const { error } = await clearMovedStageRoles(client, 'board1', [
      { id: 'a', label: 'A', color: 'c' },
      { id: 'b', label: 'B', color: 'c', role: 'reuniao_agendada' },
    ]);
    expect(error).toBeNull();
    expect(calls).toEqual([{ op: 'update', payload: { role: null }, ids: ['a'] }]);
  });

  it('não mexe em etapa cujo papel não mudou', async () => {
    const { client, calls } = fakeClient([{ id: 'a', role: 'analise_documentos' }]);
    await clearMovedStageRoles(client, 'board1', [
      { id: 'a', label: 'A', color: 'c', role: 'analise_documentos' },
    ]);
    expect(calls).toEqual([]);
  });

  it('ignora etapas que serão removidas ou não tinham papel', async () => {
    const { client, calls } = fakeClient([{ id: 'x', role: null }]);
    await clearMovedStageRoles(client, 'board1', [{ id: 'x', label: 'X', color: 'c' }]);
    expect(calls).toEqual([]);
  });
});
