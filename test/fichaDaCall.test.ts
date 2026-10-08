import { describe, expect, it } from 'vitest';

import {
  agendamentoDaAtividade,
  callPendente,
  fimDaCall,
  refDoAgendamento,
  ResultadoSchema,
  sugerirTecnico,
} from '@/lib/calls/ficha';

describe('sugerirTecnico', () => {
  it('sugere o livre com menos visitas na semana', () => {
    expect(
      sugerirTecnico([
        { id: '1', nome: 'Pedro', livre: true, visitasSemana: 4 },
        { id: '2', nome: 'Santiago', livre: true, visitasSemana: 2 },
        { id: '3', nome: 'Lucas', livre: false, visitasSemana: 0 },
      ]),
    ).toBe('2');
  });

  it('nunca sugere quem está ocupado, mesmo com menos visitas', () => {
    expect(
      sugerirTecnico([
        { id: '3', nome: 'Lucas', livre: false, visitasSemana: 0 },
        { id: '1', nome: 'Pedro', livre: true, visitasSemana: 9 },
      ]),
    ).toBe('1');
  });

  it('empate fica com a ordem alfabética, para a sugestão não mudar a cada abertura', () => {
    expect(
      sugerirTecnico([
        { id: 'b', nome: 'Santiago', livre: true, visitasSemana: 1 },
        { id: 'a', nome: 'Álvaro', livre: true, visitasSemana: 1 },
      ]),
    ).toBe('a');
  });

  it('ninguém livre, ninguém sugerido', () => {
    expect(sugerirTecnico([{ id: '1', nome: 'Pedro', livre: false, visitasSemana: 0 }])).toBeNull();
    expect(sugerirTecnico([])).toBeNull();
  });
});

describe('callPendente', () => {
  const call = {
    type: 'MEETING',
    date: '2026-10-08T14:00:00.000Z',
    endsAt: '2026-10-08T15:00:00.000Z',
    externalRef: 'sz-agendamento-7',
  };

  it('reunião comum do CRM, sem vendedor nem origem na Marina, não cobra resultado', () => {
    const depois = new Date('2026-10-08T16:00:00.000Z');
    expect(callPendente({ ...call, externalRef: null }, depois)).toBe(false);
    expect(callPendente({ ...call, externalRef: null, sellerRef: '3' }, depois)).toBe(true);
  });

  it('pendente só depois do fim da call', () => {
    expect(callPendente(call, new Date('2026-10-08T14:30:00.000Z'))).toBe(false);
    expect(callPendente(call, new Date('2026-10-08T15:00:00.000Z'))).toBe(true);
  });

  it('com resultado, cancelada ou que não é call, não conta', () => {
    const depois = new Date('2026-10-08T16:00:00.000Z');
    expect(callPendente({ ...call, callResult: 'retornar' }, depois)).toBe(false);
    expect(callPendente({ ...call, visitStatus: 'cancelada' }, depois)).toBe(false);
    expect(callPendente({ ...call, type: 'VISITA' }, depois)).toBe(false);
  });

  it('sem fim gravado, a call dura uma hora', () => {
    const semFim = { type: 'MEETING', date: '2026-10-08T14:00:00.000Z', sellerRef: '3' };
    expect(fimDaCall(semFim).toISOString()).toBe('2026-10-08T15:00:00.000Z');
    expect(callPendente(semFim, new Date('2026-10-08T14:59:00.000Z'))).toBe(false);
  });
});

describe('agendamento do banco do agente', () => {
  it('ida e volta pelo external_ref', () => {
    expect(refDoAgendamento(42)).toBe('sz-agendamento-42');
    expect(agendamentoDaAtividade('sz-agendamento-42')).toBe('42');
  });

  it('atividade criada no CRM não tem agendamento de origem', () => {
    expect(agendamentoDaAtividade(null)).toBeNull();
    expect(agendamentoDaAtividade('outra-coisa')).toBeNull();
    expect(agendamentoDaAtividade('sz-agendamento-')).toBeNull();
  });
});

describe('ResultadoSchema', () => {
  const visita = { inicio: '2026-10-10T12:00:00.000Z', endereco: 'Rua das Flores, 120', tecnicoId: '2' };

  it('agendar visita pede a visita completa', () => {
    expect(ResultadoSchema.safeParse({ resultado: 'agendar_visita' }).success).toBe(false);
    expect(ResultadoSchema.safeParse({ resultado: 'agendar_visita', visita: { ...visita, tecnicoId: '' } }).success).toBe(false);
    const ok = ResultadoSchema.safeParse({ resultado: 'agendar_visita', visita });
    expect(ok.success).toBe(true);
    expect(ok.success && ok.data.visita?.duracaoMin).toBe(60);
  });

  it('sem interesse pede o motivo, e só os que o banco do agente aceita', () => {
    expect(ResultadoSchema.safeParse({ resultado: 'sem_interesse' }).success).toBe(false);
    expect(ResultadoSchema.safeParse({ resultado: 'sem_interesse', motivo: 'caro' }).success).toBe(false);
    expect(ResultadoSchema.safeParse({ resultado: 'sem_interesse', motivo: 'preco' }).success).toBe(true);
  });

  it('retornar pede a data', () => {
    expect(ResultadoSchema.safeParse({ resultado: 'retornar' }).success).toBe(false);
    expect(ResultadoSchema.safeParse({ resultado: 'retornar', retornarEm: 'amanhã' }).success).toBe(false);
    expect(ResultadoSchema.safeParse({ resultado: 'retornar', retornarEm: '2026-10-09T13:00:00.000Z' }).success).toBe(true);
  });

  it('não atendeu não pede nada', () => {
    expect(ResultadoSchema.safeParse({ resultado: 'nao_atendeu' }).success).toBe(true);
  });
});
