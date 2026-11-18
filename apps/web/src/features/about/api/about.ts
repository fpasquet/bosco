import type { AboutDto, UpdateChannelDto } from '@bosco/domain';

/** Réglages › À propos et bandeau : la version qui tourne et les mises à jour. */
export const aboutQuery = {
  queryKey: ['about'],
  queryFn: async (): Promise<AboutDto> => {
    const response = await fetch('/api/about');
    if (!response.ok) throw new Error(`GET /api/about answered ${response.status}`);
    return (await response.json()) as AboutDto;
  },
};

/** Le journal des versions embarqué avec la version qui tourne. */
export const changelogQuery = {
  queryKey: ['about', 'changelog'],
  queryFn: async (): Promise<string> => {
    const response = await fetch('/api/about/changelog');
    if (!response.ok) throw new Error(`GET /api/about/changelog answered ${response.status}`);
    const { markdown } = (await response.json()) as { markdown: string };
    return markdown;
  },
};

async function send(method: 'POST' | 'PUT', path: string, body?: unknown): Promise<AboutDto> {
  const response = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) throw new Error(`${method} ${path} answered ${response.status}`);
  return (await response.json()) as AboutDto;
}

export function chooseUpdates(choice: { channel: UpdateChannelDto; enabled: boolean }): Promise<AboutDto> {
  return send('PUT', '/api/about/updates', choice);
}

export function checkUpdates(): Promise<AboutDto> {
  return send('POST', '/api/about/check');
}

export function dismissNotice(notice: 'available' | 'installed', version: string): Promise<AboutDto> {
  return send('POST', '/api/about/dismiss', { notice, version });
}
