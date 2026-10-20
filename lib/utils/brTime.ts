/** Fuso do escritório. A agenda mostra tudo neste horário, seja qual for o fuso do computador. */
export const OFFICE_TIME_ZONE = 'America/Sao_Paulo';

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: OFFICE_TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  hourCycle: 'h23',
});

export interface OfficeDateParts {
  year: number;
  /** 0 = janeiro (mesma convenção de Date#getMonth) */
  month: number;
  day: number;
  hour: number;
}

/** Ano, mês, dia e hora de um instante no horário de Brasília. */
export function officeDateParts(date: Date | string): OfficeDateParts {
  const d = typeof date === 'string' ? new Date(date) : date;
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(partsFormatter.formatToParts(d).find((p) => p.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month') - 1, day: get('day'), hour: get('hour') % 24 };
}

/**
 * Brasília está fixa em UTC−3 desde 2019 (sem horário de verão). Se isso mudar,
 * troque por um cálculo de offset via Intl.
 */
const OFFICE_UTC_OFFSET_MS = -3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Início (00:00) e fim (00:00 do dia seguinte) do dia de hoje no horário de Brasília, em ms. */
export function officeDayBounds(now: Date = new Date()): { todayTs: number; tomorrowTs: number } {
  const p = officeDateParts(now);
  const todayTs = Date.UTC(p.year, p.month, p.day) - OFFICE_UTC_OFFSET_MS;
  return { todayTs, tomorrowTs: todayTs + DAY_MS };
}
