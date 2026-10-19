/**
 * Data no formato do campo `<input type="date">` (AAAA-MM-DD) no fuso de quem usa.
 * `toISOString()` usa UTC: no Brasil, depois das 21h ela já devolve o dia seguinte.
 */
export function toLocalDateInput(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
