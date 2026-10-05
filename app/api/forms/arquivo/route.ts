/**
 * @fileoverview Endereço temporário para ver um arquivo anexado num formulário.
 *
 * O arquivo fica num balde privado. Esta rota confere que quem pediu está
 * logado e que o arquivo pertence à empresa da sessão, e devolve um endereço
 * que vence em cinco minutos.
 */

import { NextResponse } from 'next/server';

import { isAllowedOrigin } from '@/lib/security/sameOrigin';
import { createClient, createStaticAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const BUCKET = 'deal-files';

export async function GET(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const profile = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  const organizationId = profile.data?.organization_id as string | undefined;
  if (!organizationId) return NextResponse.json({ error: 'Perfil sem empresa' }, { status: 404 });

  const path = new URL(request.url).searchParams.get('path') || '';
  // O caminho é montado como <empresa>/formularios/<link>/<arquivo> no envio.
  if (!path || path.includes('..') || !path.startsWith(`${organizationId}/formularios/`)) {
    return NextResponse.json({ error: 'Arquivo fora da sua empresa' }, { status: 403 });
  }

  const admin = createStaticAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
