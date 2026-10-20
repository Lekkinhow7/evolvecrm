import { describe, expect, it, vi } from 'vitest';
import { fetchEvolutionAvatar, isAvatarExpired } from './whatsappAvatar';

const now = Date.parse('2026-10-20T12:00:00Z');
const hex = (ms: number) => Math.floor(ms / 1000).toString(16);

describe('isAvatarExpired', () => {
  it('sem foto conta como vencida', () => {
    expect(isAvatarExpired(null, now)).toBe(true);
  });
  it('vence daqui a uma semana: ainda vale', () => {
    expect(isAvatarExpired(`https://pps.whatsapp.net/v/x.jpg?oe=${hex(now + 7 * 864e5)}`, now)).toBe(false);
  });
  it('vence em menos de um dia: busca de novo', () => {
    expect(isAvatarExpired(`https://pps.whatsapp.net/v/x.jpg?oe=${hex(now + 3600e3)}`, now)).toBe(true);
  });
  it('URL sem oe não vence', () => {
    expect(isAvatarExpired('https://exemplo.com/foto.jpg', now)).toBe(false);
  });
});

describe('fetchEvolutionAvatar', () => {
  const creds = { serverUrl: 'https://evo.exemplo.com/', apiKey: 'k', instanceName: 'alice' };

  it('chama a Evolution com o número só em dígitos e devolve a URL', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ profilePictureUrl: 'https://pps.whatsapp.net/a.jpg' })));
    const url = await fetchEvolutionAvatar(creds, '+55 71 99195-0019', fetchImpl as unknown as typeof fetch);
    expect(url).toBe('https://pps.whatsapp.net/a.jpg');
    const [calledUrl, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(calledUrl).toBe('https://evo.exemplo.com/chat/fetchProfilePictureUrl/alice');
    expect(JSON.parse(init.body as string)).toEqual({ number: '5571991950019' });
  });

  it('contato sem foto devolve null', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ profilePictureUrl: null })));
    expect(await fetchEvolutionAvatar(creds, '+5571991950019', fetchImpl as unknown as typeof fetch)).toBeNull();
  });

  it('sem credenciais não chama nada', async () => {
    const fetchImpl = vi.fn();
    expect(await fetchEvolutionAvatar({}, '+5571991950019', fetchImpl as unknown as typeof fetch)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
