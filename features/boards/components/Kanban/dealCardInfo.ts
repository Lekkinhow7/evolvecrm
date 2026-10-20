import type { Activity, DealView } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Assunto do caso a partir do título do negócio. Negócio criado pelo WhatsApp
 * chega como "Maria - WhatsApp" (sem assunto); do site, "Maria (Fraude bancária)".
 */
export function dealSubject(deal: Pick<DealView, 'title' | 'contactName'>): string {
  const title = (deal.title || '').trim();
  const name = (deal.contactName || '').trim();
  let rest = title;
  if (name && title.toLocaleLowerCase('pt-BR').startsWith(name.toLocaleLowerCase('pt-BR'))) {
    rest = title.slice(name.length).trim();
  }
  rest = rest.replace(/^[-–·:]\s*/, '').replace(/^\((.*)\)$/, '$1').trim();
  if (!rest || /^whatsapp$/i.test(rest)) return '';
  return rest === title && title === name ? '' : rest;
}

/** "+5571991950019" → "(71) 99195-0019"; "+557188417064" → "(71) 8841-7064". */
export function formatPhoneBR(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return phone;
}

/** Dias inteiros desde a última mudança de etapa (ou criação). */
export function daysInStage(deal: Pick<DealView, 'lastStageChangeDate' | 'createdAt'>, now = Date.now()): number {
  const since = Date.parse(deal.lastStageChangeDate || deal.createdAt);
  if (!Number.isFinite(since)) return 0;
  return Math.max(0, Math.floor((now - since) / DAY_MS));
}

/** Próxima reunião (não concluída, não cancelada, a partir de agora) de cada negócio. */
export function nextMeetingByDeal(activities: Activity[], now = Date.now()): Map<string, string> {
  const map = new Map<string, string>();
  for (const a of activities) {
    if (a.type !== 'MEETING' || a.completed || !a.dealId) continue;
    if (a.meetingStatus === 'cancelada') continue;
    const ts = Date.parse(a.date);
    if (!Number.isFinite(ts) || ts < now) continue;
    const current = map.get(a.dealId);
    if (!current || ts < Date.parse(current)) map.set(a.dealId, a.date);
  }
  return map;
}

const MEETING_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

/** "qui., 14:00" → "Qui 14:00" */
export function formatMeetingShort(iso: string): string {
  const parts = MEETING_FORMATTER.formatToParts(new Date(iso));
  const weekday = (parts.find((p) => p.type === 'weekday')?.value ?? '').replace('.', '');
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '';
  const day = weekday ? weekday.charAt(0).toLocaleUpperCase('pt-BR') + weekday.slice(1) : '';
  return `${day} ${hour}:${minute}`.trim();
}
