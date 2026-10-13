/**
 * @fileoverview Botões "Pausar o agente" e "Devolver para o agente" da conversa.
 *
 * Só vale para conversa de WhatsApp pela uazapi, em que o número é o mesmo do
 * agente de IA. Quem cala o agente de verdade é o n8n (pela ficha da call, o mesmo
 * webhook que o CRM já usa); aqui fica gravado o estado para a tela mostrar.
 * - pausar: o agente fica calado neste cliente até alguém devolver.
 * - devolver: o agente volta na hora e responde o que ficou sem resposta.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient, createStaticAdminClient } from '@/lib/supabase/server';
import { isAllowedOrigin } from '@/lib/security/sameOrigin';
import { chamarFichaNoN8n, FichaN8nError } from '@/lib/calls/n8n';

export const runtime = 'nodejs';

const Corpo = z.object({ acao: z.enum(['pausar', 'devolver']) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 });
  }
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const corpo = Corpo.safeParse(await request.json().catch(() => null));
  if (!corpo.success) return NextResponse.json({ error: 'Ação inválida' }, { status: 422 });

  // A leitura passa pelo RLS do usuário: só vê a conversa quem é da organização.
  const { data: conversa } = await supabase
    .from('messaging_conversations')
    .select('id, external_contact_id, metadata, channel:messaging_channels!channel_id ( provider )')
    .eq('id', id)
    .maybeSingle();
  if (!conversa) return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
  const provider = (conversa.channel as unknown as { provider?: string } | null)?.provider;
  if (provider !== 'uazapi') {
    return NextResponse.json({ error: 'Esta conversa não é do número do agente' }, { status: 422 });
  }

  const identificador = `${String(conversa.external_contact_id).replace(/\D/g, '')}@s.whatsapp.net`;
  try {
    await chamarFichaNoN8n(corpo.data.acao === 'pausar' ? 'agente_pausar' : 'agente_devolver', { identificador });
  } catch (erro) {
    const msg = erro instanceof FichaN8nError ? erro.message : 'Falha ao falar com o n8n';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const meta = { ...((conversa.metadata as Record<string, unknown> | null) || {}) };
  meta.agente = corpo.data.acao === 'pausar'
    ? { modo: 'pausado_sem_prazo', ate: null, por: user.id, em: new Date().toISOString() }
    : { modo: 'ativo', ate: null, por: user.id, em: new Date().toISOString() };
  await createStaticAdminClient().from('messaging_conversations').update({ metadata: meta }).eq('id', id);

  return NextResponse.json({ ok: true, agente: meta.agente });
}
