import { describe, it, expect } from 'vitest';
import { transformStage, transformStageToDb, type DbBoardStage } from './boards';

const baseDb: DbBoardStage = {
  id: 's1', organization_id: 'o1', board_id: 'b1', name: 'Etapa', label: 'Etapa', color: null,
  order: 0, is_default: false, linked_lifecycle_stage: null, created_at: 'x',
};

describe('papel da etapa (role)', () => {
  it('lê role do banco', () => {
    expect(transformStage({ ...baseDb, role: 'reuniao_agendada' }).role).toBe('reuniao_agendada');
  });
  it('null no banco vira undefined', () => {
    expect(transformStage({ ...baseDb, role: null }).role).toBeUndefined();
    expect(transformStage(baseDb).role).toBeUndefined();
  });
  it('grava role no banco', () => {
    const db = transformStageToDb({ id: 's1', label: 'E', color: 'c', role: 'analise_documentos' }, 'b1', 0, 'o1');
    expect(db.role).toBe('analise_documentos');
  });
  it('undefined vira null ao gravar', () => {
    const db = transformStageToDb({ id: 's1', label: 'E', color: 'c' }, 'b1', 0, 'o1');
    expect(db.role).toBeNull();
  });
});
