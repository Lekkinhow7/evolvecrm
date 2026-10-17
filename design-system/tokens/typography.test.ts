import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

function rule(css: string, selector: string): string {
  const i = css.indexOf(selector + '{');
  if (i < 0) throw new Error(`regra ${selector} não encontrada`);
  return css.slice(i, css.indexOf('}', i));
}

describe('números do design system', () => {
  it('--font-pixel usa Onest', () => {
    const decl = /--font-pixel:([^;]+);/.exec(read('design-system/tokens/typography.css'))?.[1] ?? '';
    expect(decl.startsWith('var(--font-onest')).toBe(true);
    expect(decl).not.toMatch(/Pixelify|GNF/);
  });

  it('valores numéricos usam peso 600 e dígitos proporcionais', () => {
    const cards = read('design-system/components/cards/cards.css');
    const charts = read('design-system/components/charts/charts.css');
    for (const r of [rule(cards, '.at-stat__value'), rule(cards, '.at-metric__value'), rule(charts, '.at-donut__value'), rule(charts, '.at-gauge__value')]) {
      expect(r).toContain('font-weight:600');
      expect(r).toContain('proportional-nums');
    }
  });

  it('DESIGN.md kpi em Onest', () => {
    const md = read('DESIGN.md');
    const kpi = md.slice(md.indexOf('  kpi:'), md.indexOf('rounded:'));
    expect(kpi).toContain('fontFamily: Onest');
    expect(kpi).toContain('fontWeight: 600');
  });
});
