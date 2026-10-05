import { describe, expect, it } from 'vitest';

import { buildColumnUpdates, parseCurrency, parseMoment } from '@/lib/forms/targets';

describe('parseMoment', () => {
  it('monta a hora no fuso de Brasília, não no fuso do servidor', () => {
    // Visita em 05/10/2026, meio-dia em Brasília (15:00 UTC).
    const visita = '2026-10-05T15:00:00.000Z';
    expect(parseMoment('14:30', visita)).toBe('2026-10-05T17:30:00.000Z');
  });

  it('usa o dia da visita visto em Brasília, não o dia em UTC', () => {
    // 23:30 em Brasília do dia 05 é 02:30 UTC do dia 06.
    const visita = '2026-10-06T02:30:00.000Z';
    expect(parseMoment('08:00', visita)).toBe('2026-10-05T11:00:00.000Z');
  });

  it('aceita data completa sem mexer', () => {
    expect(parseMoment('2026-10-05T12:00:00.000Z')).toBe('2026-10-05T12:00:00.000Z');
  });

  it('devolve nulo para texto que não é hora', () => {
    expect(parseMoment('de manhã', '2026-10-05T15:00:00.000Z')).toBeNull();
    expect(parseMoment('', '2026-10-05T15:00:00.000Z')).toBeNull();
  });
});

describe('parseCurrency', () => {
  it('entende o formato brasileiro', () => {
    expect(parseCurrency('R$ 2.500,00')).toBe(2500);
    expect(parseCurrency('1.234,56')).toBe(1234.56);
  });

  it('entende número cru e formato com ponto decimal', () => {
    expect(parseCurrency('2500.5')).toBe(2500.5);
    expect(parseCurrency(99)).toBe(99);
  });

  it('devolve nulo quando não há número', () => {
    expect(parseCurrency('a combinar')).toBeNull();
    expect(parseCurrency(undefined)).toBeNull();
  });
});

describe('buildColumnUpdates', () => {
  const campos = [
    { key: 'situacao', targetColumn: 'activity.visit_status' },
    { key: 'chegada', targetColumn: 'activity.arrival_at' },
    { key: 'valor', targetColumn: 'deal.quote_value' },
    { key: 'status_orc', targetColumn: 'deal.quote_status' },
    { key: 'observacao', targetColumn: null },
  ];

  it('aceita opção escrita com acento', () => {
    const r = buildColumnUpdates(campos, { situacao: 'Não compareceu' }, '2026-10-05T15:00:00.000Z');
    expect(r.activity.visit_status).toBe('nao_compareceu');
  });

  it('marca a data de envio quando o orçamento sai', () => {
    const r = buildColumnUpdates(campos, { status_orc: 'Enviado ao cliente', valor: 'R$ 2.500,00' }, null);
    expect(r.deal.quote_status).toBe('enviado');
    expect(r.deal.quote_value).toBe(2500);
    expect(typeof r.deal.quote_sent_at).toBe('string');
  });

  it('ignora resposta de campo sem coluna de destino', () => {
    const r = buildColumnUpdates(campos, { observacao: 'qualquer coisa' }, null);
    expect(r.deal).toEqual({});
    expect(r.activity).toEqual({});
  });

  it('ignora situação que não existe', () => {
    const r = buildColumnUpdates(campos, { situacao: 'inventada' }, null);
    expect(r.activity).toEqual({});
  });
});
