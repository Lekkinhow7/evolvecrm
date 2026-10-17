import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// O CRM liga o tema escuro com a classe `.dark` no <html>; as páginas de referência usam [data-theme="dark"].
// Toda regra escura dos componentes precisa responder aos dois.
describe('regras do tema escuro nos componentes', () => {
  const dir = resolve(__dirname);
  const files = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())
    .flatMap((d) => readdirSync(resolve(dir, d.name)).filter((f) => f.endsWith('.css')).map((f) => resolve(dir, d.name, f)));

  it('toda regra [data-theme="dark"] também vale para .dark', () => {
    const missing: string[] = [];
    for (const file of files) {
      const css = readFileSync(file, 'utf8');
      for (const m of css.matchAll(/\[data-theme="dark"\]\s+([^,{]+)/g)) {
        const target = m[1].trim();
        if (!css.includes(`.dark ${target}`)) missing.push(`${file.split(/[\/]/).pop()}: ${target}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
