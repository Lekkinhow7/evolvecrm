/**
 * Foto de perfil do WhatsApp (Evolution API).
 *
 * As URLs do WhatsApp (pps.whatsapp.net) vencem: o parâmetro `oe` traz a data
 * de expiração em segundos, em hexadecimal. Uma foto vencida (ou perto de
 * vencer) é buscada de novo.
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** true se não há foto ou se a URL vence em menos de um dia. */
export function isAvatarExpired(url: string | null | undefined, now = Date.now()): boolean {
  if (!url) return true;
  try {
    const oe = new URL(url).searchParams.get('oe');
    if (!oe) return false;
    const expiresAt = parseInt(oe, 16) * 1000;
    if (!Number.isFinite(expiresAt)) return false;
    return expiresAt - now < ONE_DAY_MS;
  } catch {
    return true;
  }
}

export interface EvolutionCredentials {
  serverUrl?: string;
  apiKey?: string;
  instanceName?: string;
}

/**
 * Busca a URL da foto de perfil de um número. Devolve null quando o contato não
 * tem foto, esconde a foto (privacidade) ou a Evolution não responde.
 */
export async function fetchEvolutionAvatar(
  credentials: EvolutionCredentials,
  phone: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const { serverUrl, apiKey, instanceName } = credentials;
  const number = phone.replace(/\D/g, '');
  if (!serverUrl || !apiKey || !instanceName || !number) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetchImpl(
      `${serverUrl.replace(/\/$/, '')}/chat/fetchProfilePictureUrl/${encodeURIComponent(instanceName)}`,
      {
        method: 'POST',
        headers: { apikey: apiKey, 'content-type': 'application/json' },
        body: JSON.stringify({ number }),
        signal: controller.signal,
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { profilePictureUrl?: string | null };
    const url = data?.profilePictureUrl;
    return typeof url === 'string' && url.startsWith('https://') ? url : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
