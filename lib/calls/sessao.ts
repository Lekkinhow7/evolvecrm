/**
 * @fileoverview Quem está usando a ficha e qual call ela abriu.
 *
 * As duas rotas da ficha começam igual: a sessão tem que existir, o perfil tem
 * que ter empresa, e a call tem que ser uma reunião dessa empresa. O RLS já
 * limita a leitura à empresa da sessão; não achar é o mesmo que não ser dela.
 *
 * @module lib/calls/sessao
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export interface CallDaFicha {
  id: string;
  organization_id: string;
  title: string;
  date: string;
  ends_at: string | null;
  deal_id: string | null;
  contact_id: string | null;
  address: string | null;
  address_note: string | null;
  external_ref: string | null;
  seller_ref: string | null;
  seller_label: string | null;
  call_result: string | null;
  call_notes: string | null;
}

export async function abrirCallDaSessao(
  callId: string,
): Promise<{ ok: true; call: CallDaFicha } | { ok: false; resposta: NextResponse }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, resposta: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };

  const call = await supabase
    .from('activities')
    .select(
      'id, organization_id, type, title, date, ends_at, deal_id, contact_id, address, address_note, external_ref, seller_ref, seller_label, call_result, call_notes',
    )
    .eq('id', callId)
    .is('deleted_at', null)
    .maybeSingle();
  if (call.error || !call.data || call.data.type !== 'MEETING') {
    return { ok: false, resposta: NextResponse.json({ error: 'Call não encontrada' }, { status: 404 }) };
  }
  return { ok: true, call: call.data as unknown as CallDaFicha };
}
