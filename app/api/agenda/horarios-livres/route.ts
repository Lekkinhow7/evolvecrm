/**
 * GET /api/agenda/horarios-livres?dias=14 — horários livres vindos do n8n.
 */
import { NextResponse } from 'next/server'
import { chamarAgendaNoN8n } from '@/lib/agenda/n8n'
import { autenticarRotaInterna, respostaFalhaN8n } from '@/lib/agenda/rotaInterna'

export async function GET(request: Request) {
  const auth = await autenticarRotaInterna()
  if (auth.erro) return auth.erro
  const bruto = Number(new URL(request.url).searchParams.get('dias'))
  const dias = Number.isFinite(bruto) && bruto > 0 ? Math.min(Math.floor(bruto), 60) : 14
  try {
    const r = await chamarAgendaNoN8n<{ horarios?: unknown[] }>('horarios_livres', { dias })
    return NextResponse.json({ horarios: Array.isArray(r?.horarios) ? r.horarios : [] })
  } catch (e) {
    return respostaFalhaN8n(e)
  }
}
