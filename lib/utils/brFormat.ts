/** Formatos pt-BR da interface: dinheiro, percentual e variação. */

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const decimal1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "R$ 12.500" (sem centavos: os cartões mostram valores redondos). */
export function formatBRL(value: number): string {
  return brl.format(Number.isFinite(value) ? value : 0).replace(/ /g, ' ');
}

/** "12,4%" */
export function formatPercent(value: number): string {
  return `${decimal1.format(Number.isFinite(value) ? value : 0)}%`;
}

/** "+12,4%" / "-3,0%" e se a variação é boa (zero conta como positiva). */
export function formatChange(value: number): { text: string; isPositive: boolean } {
  const safe = Number.isFinite(value) ? value : 0;
  const isPositive = safe >= 0;
  return { text: `${isPositive ? '+' : ''}${formatPercent(safe)}`, isPositive };
}
