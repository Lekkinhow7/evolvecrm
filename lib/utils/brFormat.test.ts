import { describe, expect, it } from 'vitest';
import { formatBRL, formatChange, formatPercent } from './brFormat';

describe('formatos da Visão geral', () => {
  it('dinheiro em reais, com ponto no milhar e sem centavos', () => {
    expect(formatBRL(12500)).toBe('R$ 12.500');
    expect(formatBRL(0)).toBe('R$ 0');
    expect(formatBRL(Number.NaN)).toBe('R$ 0');
  });

  it('percentual com vírgula', () => {
    expect(formatPercent(85.83)).toBe('85,8%');
  });

  it('variação com sinal', () => {
    expect(formatChange(72.1)).toEqual({ text: '+72,1%', isPositive: true });
    expect(formatChange(-3)).toEqual({ text: '-3,0%', isPositive: false });
    expect(formatChange(0)).toEqual({ text: '+0,0%', isPositive: true });
  });
});
