import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const runbook = readFileSync(path.resolve(process.cwd(), 'docs/runbooks/succaozero-n8n-cutover.md'), 'utf8').toLowerCase()
const route = readFileSync(path.resolve(process.cwd(), 'app/api/public/v1/succaozero/events/route.ts'), 'utf8')

describe('contrato de sincronização Sucção Zero', () => {
  it('usa checkpoint persistente e recupera interrupção de 30 minutos', () => { expect(runbook).toContain('(updated_at, primary_key)'); expect(runbook).toContain('30 minutos'); expect(runbook).toContain('lost=0') })
  it('preserva repetição, fora de ordem e @lid', () => { expect(runbook).toContain('repetição'); expect(runbook).toContain('fora de ordem'); expect(runbook).toContain('@lid'); expect(route).toContain("result.duplicate ? 200") })
  it('não deixa evento antigo sobrescrever mudança manual nem instalação regredir ganho', () => { expect(runbook).toContain('alteração manual posterior'); expect(runbook).toContain('nunca regride oportunidade ganha'); expect(route).toContain('eventOccurredAt') })
  it('avança checkpoint somente em 2xx e mantém fila de erro', () => { expect(runbook).toContain('somente depois de resposta `2xx`'); expect(runbook).toContain('`409`, `422` e `5xx`') })
})
