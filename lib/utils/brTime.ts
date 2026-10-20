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
