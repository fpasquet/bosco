import type { DataTable } from 'playwright-bdd';
// Phrases du suivi en direct : réglages des profils, et hooks envoyés à Bosco comme le fait Claude Code.
import { expect } from '@playwright/test';
import { cpSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ApiResponse } from './fixtures.ts';
import { sendHook, settingsOf, sourceIdOf } from '../../shared/hooks.ts';
import { FEATURES } from '../paths.ts';
import { Given, Then, When } from './fixtures.ts';

/** Demande de hook laissée en attente, que Claude Code peut abandonner (réponse donnée dans le terminal). */
let pendingHook: AbortController | null = null;

function fixture(file: string, profilesRoot: string): string {
  return readFileSync(join(FEATURES, file), 'utf8').replaceAll('{{profiles}}', profilesRoot);
}

function sendFixture(
  profilesRoot: string,
  profile: string,
  file: string,
  options?: { secret?: boolean; signal?: AbortSignal },
): Promise<ApiResponse> {
  const input = JSON.parse(fixture(file, profilesRoot)) as Record<string, unknown> & { hook_event_name: string };
  return sendHook(profilesRoot, profile, input, options);
}

Given('the Claude Code profile {string} has the settings {string}', ({ bosco }, profile: string, file: string) => {
  mkdirSync(join(bosco.profilesRoot, profile), { recursive: true });
  cpSync(join(FEATURES, file), join(bosco.profilesRoot, profile, 'settings.json'));
});

Given('Bosco watches the profiles {string} and {string}', async ({ bosco }, first: string, second: string) => {
  const response = await fetch(`${bosco.url}/api/sources`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ paths: [join(bosco.profilesRoot, first), join(bosco.profilesRoot, second)] }),
  });
  expect(response.status).toBe(201);
});

When('I install live tracking for the profile {string}', async ({ bosco, last, request }, profile: string) => {
  const id = await sourceIdOf(bosco.url, profile);
  const response = await request.put(`/api/sources/${id}/live-tracking`, { data: { backup: true } });
  last.response = { status: response.status(), body: (await response.json()) as unknown };
});

When('I uninstall live tracking for the profile {string}', async ({ bosco, last, request }, profile: string) => {
  const id = await sourceIdOf(bosco.url, profile);
  const response = await request.delete(`/api/sources/${id}/live-tracking`);
  last.response = { status: response.status(), body: (await response.json()) as unknown };
});

Then(
  'the settings of the profile {string} should call Bosco on {int} events',
  ({ bosco }, profile: string, count: number) => {
    const { hooks = {} } = settingsOf(bosco.profilesRoot, profile);
    const calling = Object.values(hooks).filter((groups) =>
      groups.some((group) => (group.hooks ?? []).some((hook) => hook.url?.includes('/api/hooks/'))),
    );
    expect(calling).toHaveLength(count);
  },
);

Then('the settings of the profile {string} should equal {string}', ({ bosco }, profile: string, file: string) => {
  expect(settingsOf(bosco.profilesRoot, profile)).toEqual(JSON.parse(fixture(file, bosco.profilesRoot)));
});

When(
  'Claude Code sends the hook {string} of the profile {string}',
  async ({ bosco, last }, file: string, profile: string) => {
    last.response = await sendFixture(bosco.profilesRoot, profile, file);
  },
);

When(
  'Claude Code sends the hook {string} of the profile {string} without the secret',
  async ({ bosco, last }, file: string, profile: string) => {
    last.response = await sendFixture(bosco.profilesRoot, profile, file, { secret: false });
  },
);

When(
  'Claude Code sends the hook {string} of the profile {string} without waiting',
  async ({ bosco, last }, file: string, profile: string) => {
    pendingHook = new AbortController();
    last.pending = sendFixture(bosco.profilesRoot, profile, file, { signal: pendingHook.signal });
    // une demande abandonnée par Claude Code n'est pas une erreur du scénario
    last.pending.catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 200));
  },
);

When('Claude Code gives up the pending hook', async () => {
  pendingHook?.abort();
  pendingHook = null;
  await new Promise((resolve) => setTimeout(resolve, 200));
});

When(
  'I answer the permission of the session {string} with the JSON {string}',
  async ({ bosco, last, request }, sessionId: string, file: string) => {
    const listed = await request.get('/api/sessions');
    const { sessions } = (await listed.json()) as {
      sessions: { id: string; waiting: { requestId?: string } | null }[];
    };
    const requestId = sessions.find((session) => session.id === sessionId)?.waiting?.requestId ?? 'none';
    const answer = JSON.parse(fixture(file, bosco.profilesRoot)) as Record<string, unknown>;
    const response = await request.post(`/api/sessions/${sessionId}/permission`, { data: { ...answer, requestId } });
    const text = await response.text();
    last.response = { status: response.status(), body: text ? (JSON.parse(text) as unknown) : null };
  },
);

When(
  'I switch {word} the source of the profile {string}',
  async ({ bosco, last, request }, state: string, profile: string) => {
    const id = await sourceIdOf(bosco.url, profile);
    const response = await request.patch(`/api/sources/${id}`, { data: { watched: state === 'on' } });
    last.response = { status: response.status(), body: (await response.json()) as unknown };
    // laisse le temps à la lecture de s'arrêter ou de reprendre
    await new Promise((resolve) => setTimeout(resolve, 300));
  },
);

Then('the desktop notifications should be:', async ({ request }, table: DataTable) => {
  const response = await request.get('/__test/notifications');
  const { notifications } = (await response.json()) as { notifications: { body: string; title: string }[] };
  expect(notifications).toEqual(table.hashes());
});
