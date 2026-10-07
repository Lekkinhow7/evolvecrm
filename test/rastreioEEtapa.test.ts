import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { montarEvento } from '@/lib/meta/capi';
import { montarMudancaDeEtapa } from '@/lib/public-api/dealsMoveStage';

const sha = (v: string) => createHash('sha256').update(v).digest('hex');

describe('montarMudancaDeEtapa', () => {
  const agora = '2026-10-07T12:00:00.000Z';
  const base = { wonStageId: 'ganho', lostStageId: 'perdido', agora };

  it('não regrava nada quando o negócio já está na etapa pedida', () => {
    const r = montarMudancaDeEtapa({ ...base, atual: { stage_id: 'visita', is_won: false, is_lost: false }, stageId: 'visita' });
    expect(r).toBeNull();
  });

  it('muda a etapa e a data só quando a etapa é outra', () => {
    const r = montarMudancaDeEtapa({ ...base, atual: { stage_id: 'novo', is_won: false, is_lost: false }, stageId: 'visita' });
    expect(r).toEqual({ stage_id: 'visita', last_stage_change_date: agora, updated_at: agora });
  });

  it('repetir o ganho não muda a data de fechamento', () => {
    const r = montarMudancaDeEtapa({ ...base, atual: { stage_id: 'ganho', is_won: true, is_lost: false }, stageId: 'ganho', mark: 'won' });
    expect(r).toBeNull();
  });

  it('primeiro ganho marca o fechamento', () => {
    const r = montarMudancaDeEtapa({ ...base, atual: { stage_id: 'venda', is_won: false, is_lost: false }, stageId: 'ganho' });
    expect(r).toMatchObject({ stage_id: 'ganho', is_won: true, is_lost: false, closed_at: agora, loss_reason: null });
  });

  it('perda pedida na mesma etapa marca perdido sem mexer na data da etapa', () => {
    const r = montarMudancaDeEtapa({ ...base, atual: { stage_id: 'perdido', is_won: false, is_lost: false }, stageId: 'perdido', mark: 'lost' });
    expect(r).toEqual({ is_lost: true, is_won: false, closed_at: agora, updated_at: agora });
  });
});

describe('montarEvento (API de Conversões da Meta)', () => {
  const evento = montarEvento({
    nome: 'Lead',
    eventId: 'sz-abc-123',
    quando: new Date('2026-10-07T12:00:00.000Z'),
    pagina: 'https://succaozero.com.br/',
    telefone: '+55 (19) 99999-0000',
    primeiroNome: '  Maria Souza ',
    ip: '200.1.2.3',
    navegador: 'Mozilla/5.0',
    fbp: 'fb.1.1.2',
    fbc: null,
    extras: { content_name: 'Formulário do site', vazio: '' },
  });

  it('usa o mesmo event_id do pixel e o horário em segundos', () => {
    expect(evento.event_id).toBe('sz-abc-123');
    expect(evento.event_time).toBe(1791374400);
    expect(evento.action_source).toBe('website');
  });

  it('embaralha telefone, nome e país e não manda campo vazio', () => {
    const u = evento.user_data as Record<string, unknown>;
    expect(u.ph).toEqual([sha('5519999990000')]);
    expect(u.fn).toEqual([sha('maria')]);
    expect(u.country).toEqual([sha('br')]);
    expect(u.fbp).toBe('fb.1.1.2');
    expect(u).not.toHaveProperty('fbc');
    expect(evento.custom_data).toEqual({ content_name: 'Formulário do site' });
  });
});
