// Version et releases des scénarios : posées par les routes de test, sans appel à GitHub.
import type { Bosco } from './bosco.ts';

/** Releases du fil rouge : une stable 0.3.0 avec ses fichiers, et une beta 0.4.0-beta.1 plus récente. */
export const RELEASES = [
  {
    version: '0.4.0-beta.1',
    publishedAt: '2026-11-24T10:00:00Z',
    notes: '### Nouveautés\n\n- **sessions** · Start a session from the phone',
    assets: ['bosco-desktop_0.4.0-beta.1_amd64.deb', 'bosco-android-0.4.0-beta.1.apk'],
  },
  {
    version: '0.3.0',
    publishedAt: '2026-11-20T10:00:00Z',
    notes: '### Nouveautés\n\n- **about** · Show the version and the changelog in the settings',
    assets: [
      'bosco-desktop_0.3.0_amd64.deb',
      'bosco-desktop_0.3.0_x86_64.AppImage',
      'bosco-android-0.3.0.apk',
      'latest-linux.yml',
    ],
  },
  { version: '0.2.0', publishedAt: '2026-11-10T10:00:00Z', notes: '', assets: [] },
];

async function post(bosco: Bosco, path: string, body: unknown): Promise<void> {
  const response = await fetch(`${bosco.url}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`POST ${path} answered ${response.status}`);
}

export function publishReleases(bosco: Bosco): Promise<void> {
  return post(bosco, '/__test/releases', { releases: RELEASES });
}

export function failReleases(bosco: Bosco): Promise<void> {
  return post(bosco, '/__test/releases', { releases: [], failing: true });
}

/** Version qui tourne, et celle du lancement précédent pour simuler une mise à jour. */
export function runVersion(bosco: Bosco, body: { commit?: string; previous?: string; version: string }): Promise<void> {
  return post(bosco, '/__test/version', body);
}
