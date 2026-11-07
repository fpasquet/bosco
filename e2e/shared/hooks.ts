// Hooks envoyés à Bosco comme le fait Claude Code : l'adresse et le secret sont lus dans les réglages du profil, là où
// l'installation du suivi en direct les a écrits.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface HookCall {
  headers?: { Authorization?: string };
  url?: string;
}

export interface HookResponse {
  body: unknown;
  status: number;
}

type ProfileSettings = { hooks?: Record<string, { hooks?: HookCall[] }[]> };

export function settingsOf(profilesRoot: string, profile: string): ProfileSettings {
  return JSON.parse(readFileSync(join(profilesRoot, profile, 'settings.json'), 'utf8')) as ProfileSettings;
}

/** Appel écrit dans les réglages pour cet événement ; seuls les hooks de Bosco visent /api/hooks/. */
function hookOf(profilesRoot: string, profile: string, event: string): Required<HookCall> {
  const call = settingsOf(profilesRoot, profile)
    .hooks?.[event]?.flatMap((group) => group.hooks ?? [])
    .find((hook) => hook.url?.includes('/api/hooks/'));
  if (!call?.url || !call.headers?.Authorization) throw new Error(`No Bosco hook for ${event} in ${profile}`);
  return { url: call.url, headers: { Authorization: call.headers.Authorization } };
}

export async function sendHook(
  profilesRoot: string,
  profile: string,
  input: Record<string, unknown> & { hook_event_name: string },
  options: { secret?: boolean; signal?: AbortSignal } = {},
): Promise<HookResponse> {
  const { headers, url } = hookOf(profilesRoot, profile, input.hook_event_name);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(options.secret === false ? {} : headers) },
    body: JSON.stringify(input),
    signal: options.signal,
  });
  const text = await response.text();
  return { status: response.status, body: text ? (JSON.parse(text) as unknown) : null };
}

/** Identifiant de la source d'un profil, pour les routes de l'API. */
export async function sourceIdOf(baseURL: string, profile: string): Promise<string> {
  const response = await fetch(`${baseURL}/api/sources`);
  const { sources } = (await response.json()) as { sources: { id: string; path: string }[] };
  const source = sources.find((candidate) => candidate.path.endsWith(`/${profile}`));
  if (!source) throw new Error(`The profile ${profile} is not a source`);
  return source.id;
}
