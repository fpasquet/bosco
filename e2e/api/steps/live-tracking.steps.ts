// Phrases du suivi en direct : réglages des profils, et hooks envoyés à Bosco comme le fait Claude Code.
import { expect } from '@playwright/test';
import { cpSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ApiResponse } from './fixtures.ts';
import { FEATURES } from '../paths.ts';
import { Given, Then, When } from './fixtures.ts';

interface HookCall {
  headers?: { Authorization?: string };
  url?: string;
}

/** Demande de hook laissée en attente, que Claude Code peut abandonner (réponse donnée dans le terminal). */
let pendingHook: AbortController | null = null;

function fixture(file: string, profilesRoot: string): string {
  return readFileSync(join(FEATURES, file), 'utf8').replaceAll('{{profiles}}', profilesRoot);
}

function settingsOf(profilesRoot: string, profile: string): { hooks?: Record<string, { hooks?: HookCall[] }[]> } {
  return JSON.parse(readFileSync(join(profilesRoot, profile, 'settings.json'), 'utf8')) as {
    hooks?: Record<string, { hooks?: HookCall[] }[]>;
  };
}

/** L'appel que Claude Code ferait pour cet événement, tel qu'il est écrit dans les réglages du profil. */
function hookOf(profilesRoot: string, profile: string, event: string): Required<HookCall> {
  const call = settingsOf(profilesRoot, profile)
    .hooks?.[event]?.flatMap((group) => group.hooks ?? [])
    .find((hook) => hook.url?.includes('/api/hooks/'));
  if (!call?.url || !call.headers?.Authorization) throw new Error(`No Bosco hook for ${event} in ${profile}`);
  return { url: call.url, headers: { Authorization: call.headers.Authorization } };
}

async function sendHook(
  profilesRoot: string,
  profile: string,
  file: string,
  options: { secret?: boolean; signal?: AbortSignal } = {},
): Promise<ApiResponse> {
  const body = fixture(file, profilesRoot);
  const event = (JSON.parse(body) as { hook_event_name: string }).hook_event_name;
  const { headers, url } = hookOf(profilesRoot, profile, event);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(options.secret === false ? {} : headers) },
    body,
    signal: options.signal,
  });
  const text = await response.text();
  return { status: response.status, body: text ? (JSON.parse(text) as unknown) : null };
}

async function sourceIdOf(baseURL: string, profile: string): Promise<string> {
  const response = await fetch(`${baseURL}/api/sources`);
  const { sources } = (await response.json()) as { sources: { id: string; path: string }[] };
  const source = sources.find((candidate) => candidate.path.endsWith(`/${profile}`));
  if (!source) throw new Error(`The profile ${profile} is not a source`);
  return source.id;
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
    last.response = await sendHook(bosco.profilesRoot, profile, file);
  },
);

When(
  'Claude Code sends the hook {string} of the profile {string} without the secret',
  async ({ bosco, last }, file: string, profile: string) => {
    last.response = await sendHook(bosco.profilesRoot, profile, file, { secret: false });
  },
);

When(
  'Claude Code sends the hook {string} of the profile {string} without waiting',
  async ({ bosco, last }, file: string, profile: string) => {
    pendingHook = new AbortController();
    last.pending = sendHook(bosco.profilesRoot, profile, file, { signal: pendingHook.signal });
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
