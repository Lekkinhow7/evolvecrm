import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const source = () =>
  readFileSync(path.resolve(process.cwd(), 'lib/public-api/dealsMoveStage.ts'), 'utf8')

describe('histórico de etapa da API pública', () => {
  it('não atualiza a data quando a etapa pedida já é a atual', () => {
    const code = source()
    const unchanged = code.indexOf("action: 'unchanged'")
    const update = code.indexOf("const updates: any = { stage_id: stageId")

    expect(unchanged).toBeGreaterThan(-1)
    expect(update).toBeGreaterThan(unchanged)
  })

  it('deduplica por event_id e rejeita evento anterior ao estado atual', () => {
    const code = source()

    expect(code).toContain(".eq('event_key', opts.eventId)")
    expect(code).toContain("code: 'OUT_OF_ORDER'")
    expect(code).toContain("event_type: eventType")
  })

  it('sincroniza a projeção canônica após mover o negócio', () => {
    const code = source()

    expect(code).toContain(".from('succaozero_opportunities')")
    expect(code).toContain('stage_id: stageId')
    expect(code).toContain('status: canonicalStatus')
  })
})
