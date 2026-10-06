/**
 * @fileoverview Disparador dos lembretes da visita.
 *
 * Roda de cinco em cinco minutos, pega o que já venceu na fila e manda pelo
 * WhatsApp. Sem o endereço e o token do serviço de envio configurados, ele não
 * quebra: só relata quantas mensagens estão esperando, e elas continuam na fila
 * até alguém ligar o envio.
 */

import { NextResponse } from 'next/server';

import { createStaticAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOTE = 20;
const TENTATIVAS_MAX = 5;

function autorizado(request: Request): boolean {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return false;
  const cabecalho = request.headers.get('authorization') || '';
  return cabecalho === `Bearer ${segredo}`;
}

async function enviarWhatsapp(telefone: string, texto: string): Promise<string | null> {
  const base = (process.env.UAZAPI_URL || '').replace(/\/+$/, '');
  const token = process.env.UAZAPI_TOKEN;
  if (!base || !token) return 'envio não configurado';

  try {
    const resposta = await fetch(`${base}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token },
      body: JSON.stringify({ number: telefone, text: texto }),
    });
    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => '');
      return `falha ${resposta.status}: ${corpo.slice(0, 180)}`;
    }
    return null;
  } catch (erro) {
    return `falha de rede: ${String(erro).slice(0, 180)}`;
  }
}

export async function POST(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const envioConfigurado = Boolean(process.env.UAZAPI_URL && process.env.UAZAPI_TOKEN);

  const supabase = createStaticAdminClient();
  const fila = await supabase
    .from('outbound_messages')
    .select('id, to_phone, body, attempts')
    .is('sent_at', null)
    .is('cancelled_at', null)
    .lte('scheduled_for', new Date().toISOString())
    .lt('attempts', TENTATIVAS_MAX)
    .order('scheduled_for', { ascending: true })
    .limit(LOTE);

  if (fila.error) {
    return NextResponse.json({ error: 'Não foi possível ler a fila' }, { status: 500 });
  }

  const pendentes = fila.data || [];

  // Sem serviço de envio ligado, a fila fica intacta: nada é marcado e nenhuma
  // tentativa é gasta, para as mensagens saírem inteiras quando ele for ligado.
  if (!envioConfigurado) {
    return NextResponse.json({
      ok: true,
      envioConfigurado: false,
      pendentes: pendentes.length,
      enviadas: 0,
      falhas: 0,
    });
  }

  let enviadas = 0;
  let falhas = 0;

  for (const mensagem of pendentes) {
    const erro = await enviarWhatsapp(mensagem.to_phone as string, mensagem.body as string);
    if (erro) {
      falhas += 1;
      await supabase
        .from('outbound_messages')
        .update({ attempts: (mensagem.attempts as number) + 1, last_error: erro })
        .eq('id', mensagem.id);
      continue;
    }
    enviadas += 1;
    await supabase
      .from('outbound_messages')
      .update({ sent_at: new Date().toISOString(), attempts: (mensagem.attempts as number) + 1, last_error: null })
      .eq('id', mensagem.id);
  }

  return NextResponse.json({ ok: true, pendentes: pendentes.length, enviadas, falhas });
}
