import { createClient } from '@/lib/supabase/server';
import { isAllowedOrigin } from '@/lib/security/sameOrigin';
import { fetchEvolutionAvatar, isAvatarExpired, type EvolutionCredentials } from '@/lib/messaging/whatsappAvatar';

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/** Contatos por chamada (a Evolution responde um a um). */
const MAX_CONTACTS = 400;
const CONCURRENCY = 6;

/**
 * POST /api/messaging/avatars — busca no WhatsApp (Evolution) a foto de perfil
 * dos contatos sem foto ou com foto vencida. Só admin. O webhook mantém as
 * fotos em dia depois; esta rota serve para preencher quem já existia.
 */
export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) return json({ error: 'Forbidden' }, 403);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const { data: me } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();
  if (!me?.organization_id) return json({ error: 'Profile not found' }, 404);
  if (me.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const organizationId = me.organization_id as string;

  const { data: channel } = await supabase
    .from('messaging_channels')
    .select('credentials')
    .eq('organization_id', organizationId)
    .eq('channel_type', 'whatsapp')
    .eq('provider', 'evolution')
    .in('status', ['connected', 'active'])
    .limit(1)
    .maybeSingle();
  const credentials = (channel?.credentials ?? null) as EvolutionCredentials | null;
  if (!credentials) return json({ error: 'Nenhum WhatsApp (Evolution) conectado' }, 409);

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, phone, avatar')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .not('phone', 'is', null)
    .limit(2000);
  if (error) return json({ error: 'Erro ao ler contatos' }, 500);

  const pending = (contacts ?? [])
    .filter((c) => c.phone && isAvatarExpired(c.avatar as string | null))
    .slice(0, MAX_CONTACTS);

  let updated = 0;
  let withoutPhoto = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < pending.length) {
      const contact = pending[cursor++];
      const url = await fetchEvolutionAvatar(credentials!, contact.phone as string);
      if (!url) {
        withoutPhoto += 1;
        continue;
      }
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ avatar: url })
        .eq('id', contact.id)
        .eq('organization_id', organizationId);
      if (!updateError) updated += 1;
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return json({ checked: pending.length, updated, withoutPhoto });
}
