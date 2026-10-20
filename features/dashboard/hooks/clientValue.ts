import type { Deal } from '@/types';

/**
 * Valor médio por cliente: soma dos negócios ganhos de cada cliente, em média
 * entre os clientes que já fecharam pelo menos um. Usa os negócios (e não um
 * total guardado no contato), que é o dado que o CRM de fato mantém.
 */
export function averageWonValuePerClient(deals: Deal[]): number {
  const byClient = new Map<string, number>();
  deals.forEach((d, i) => {
    if (!d.isWon) return;
    const key = d.contactId || `sem-contato-${i}`;
    byClient.set(key, (byClient.get(key) ?? 0) + (d.value || 0));
  });
  if (byClient.size === 0) return 0;
  let total = 0;
  byClient.forEach((v) => { total += v; });
  return total / byClient.size;
}
