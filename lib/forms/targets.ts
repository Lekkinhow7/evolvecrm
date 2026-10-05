/**
 * @fileoverview Tradução de resposta de formulário para coluna real.
 *
 * O formulário guarda tudo em `answers`. Alguns campos, além disso, alimentam
 * uma coluna de `deals` ou de `activities`, porque são os números que o
 * dashboard mede e não podem depender do nome de uma pergunta editável.
 *
 * @module lib/forms/targets
 */

import { FORM_TARGET_COLUMNS, type FormTargetColumn } from '@/types/forms';

const VISIT_STATUS = new Set([
  'agendada',
  'confirmada',
  'em_atendimento',
  'concluida',
  'cancelada',
  'nao_compareceu',
]);

const QUOTE_STATUS: Record<string, string> = {
  'enviado ao cliente': 'enviado',
  enviado: 'enviado',
  aprovado: 'aprovado',
  recusado: 'recusado',
};

export function isTargetColumn(value: unknown): value is FormTargetColumn {
  return typeof value === 'string' && (FORM_TARGET_COLUMNS as readonly string[]).includes(value);
}

/** "Não compareceu" vira "nao_compareceu", para a opção poder ser escrita com acento. */
function chaveDeOpcao(valor: unknown): string {
  return String(valor)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
}

/** "R$ 1.234,50" e "1234.50" viram 1234.5. Texto sem número vira null. */
export function parseCurrency(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const limpo = value.replace(/[^0-9,.-]/g, '').trim();
  if (!limpo) return null;
  const normalizado =
    limpo.includes(',') && limpo.lastIndexOf(',') > limpo.lastIndexOf('.')
      ? limpo.replace(/\./g, '').replace(',', '.')
      : limpo.replace(/,/g, '');
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

/** "14:30" vira o horário daquele dia da visita. Data completa passa direto. */
export function parseMoment(value: unknown, referencia?: string | null): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const texto = value.trim();
  const hora = texto.match(/^(\d{1,2}):(\d{2})$/);
  if (hora) {
    const base = referencia ? new Date(referencia) : new Date();
    if (Number.isNaN(base.getTime())) return null;
    base.setHours(Number(hora[1]), Number(hora[2]), 0, 0);
    return base.toISOString();
  }
  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

export function parseDateOnly(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const data = new Date(value.trim());
  return Number.isNaN(data.getTime()) ? null : data.toISOString().slice(0, 10);
}

export interface ColumnUpdates {
  deal: Record<string, unknown>;
  activity: Record<string, unknown>;
}

/**
 * Monta as atualizações de coluna a partir das respostas.
 *
 * @param fields - Campos do formulário, com a coluna de destino quando houver.
 * @param answers - Respostas enviadas, indexadas pela chave do campo.
 * @param visitDate - Data da visita, usada para transformar hora em data e hora.
 */
export function buildColumnUpdates(
  fields: Array<{ key: string; targetColumn?: string | null }>,
  answers: Record<string, unknown>,
  visitDate?: string | null,
): ColumnUpdates {
  const updates: ColumnUpdates = { deal: {}, activity: {} };

  for (const field of fields) {
    if (!isTargetColumn(field.targetColumn)) continue;
    const bruto = answers[field.key];
    if (bruto === undefined || bruto === null || bruto === '') continue;

    switch (field.targetColumn) {
      case 'activity.arrival_at': {
        const momento = parseMoment(bruto, visitDate);
        if (momento) updates.activity.arrival_at = momento;
        break;
      }
      case 'activity.visit_status': {
        const texto = chaveDeOpcao(bruto);
        if (VISIT_STATUS.has(texto)) updates.activity.visit_status = texto;
        break;
      }
      case 'deal.quote_status': {
        const texto = QUOTE_STATUS[chaveDeOpcao(bruto).replace(/_/g, ' ')];
        if (texto) {
          updates.deal.quote_status = texto;
          if (texto === 'enviado') updates.deal.quote_sent_at = new Date().toISOString();
        }
        break;
      }
      case 'deal.quote_value': {
        const valor = parseCurrency(bruto);
        if (valor !== null) {
          updates.deal.quote_value = valor;
          if (!updates.deal.quote_sent_at) updates.deal.quote_sent_at = new Date().toISOString();
        }
        break;
      }
      case 'deal.sold_value': {
        const valor = parseCurrency(bruto);
        if (valor !== null) {
          updates.deal.sold_value = valor;
          updates.deal.sold_at = new Date().toISOString();
        }
        break;
      }
      case 'deal.discount_value': {
        const valor = parseCurrency(bruto);
        if (valor !== null) updates.deal.discount_value = valor;
        break;
      }
      case 'deal.install_date': {
        const data = parseDateOnly(bruto);
        if (data) updates.deal.install_date = data;
        break;
      }
      case 'deal.quote_items':
        updates.deal.quote_items = String(bruto);
        break;
      case 'deal.payment_method':
        updates.deal.payment_method = String(bruto);
        break;
      case 'deal.loss_reason':
        updates.deal.loss_reason = String(bruto);
        break;
    }
  }

  return updates;
}
