import { describe, it, expect } from 'vitest';
import { transformActivity, transformActivityToDb } from './activities';

describe('transformActivity (agenda)', () => {
  it('mapeia campos de reunião para camelCase', () => {
    const a = transformActivity({
      id: 'a1',
      organization_id: 'o1',
      title: 'Reunião',
      description: null,
      type: 'MEETING',
      date: '2026-10-20T13:00:00Z',
      completed: false,
      deal_id: 'd1',
      contact_id: null,
      created_at: '2026-10-19T00:00:00Z',
      owner_id: null,
      ends_at: '2026-10-20T14:00:00Z',
      external_ref: 'ext-1',
      meeting_status: 'agendada',
      meeting_format: 'online',
      meeting_url: 'https://meet.example/x',
      address: 'Rua A, 1',
      source: 'ia',
    } as never);
    expect(a.endsAt).toBe('2026-10-20T14:00:00Z');
    expect(a.externalRef).toBe('ext-1');
    expect(a.meetingStatus).toBe('agendada');
    expect(a.meetingFormat).toBe('online');
    expect(a.meetingUrl).toBe('https://meet.example/x');
    expect(a.address).toBe('Rua A, 1');
    expect(a.source).toBe('ia');
  });

  it('campos ausentes viram undefined', () => {
    const a = transformActivity({
      id: 'a1', organization_id: 'o1', title: 't', description: null, type: 'TASK',
      date: 'x', completed: false, deal_id: null, contact_id: null, created_at: 'x', owner_id: null,
    } as never);
    expect(a.endsAt).toBeUndefined();
    expect(a.meetingStatus).toBeUndefined();
    expect(a.source).toBeUndefined();
  });

  it('grava campos de reunião no formato do banco', () => {
    const db = transformActivityToDb({
      endsAt: 'e', externalRef: 'r', meetingStatus: 'realizada', meetingFormat: 'presencial',
      meetingUrl: 'u', address: 'ad', source: 'equipe',
    }) as Record<string, unknown>;
    expect(db).toMatchObject({
      ends_at: 'e', external_ref: 'r', meeting_status: 'realizada', meeting_format: 'presencial',
      meeting_url: 'u', address: 'ad', source: 'equipe',
    });
  });
});
