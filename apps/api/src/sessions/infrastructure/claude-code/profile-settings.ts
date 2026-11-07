// Réglages d'un profil Claude Code (<profil>/settings.json) : Bosco ajoute ses hooks HTTP à ceux qui existent, sans
// rien remplacer, et ne retire que les siens. Un fichier illisible n'est jamais réécrit.
import { copyFile, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { HookEndpoint, ProfileSettings } from '../../application/ports.ts';
import { DomainError } from '../../../shared/domain/domain-error.ts';
import { LIVE_TRACKING_EVENTS } from '../../application/live-tracking.service.ts';

type HookGroup = { hooks?: unknown[]; matcher?: string } & Record<string, unknown>;
type Settings = { hooks?: Record<string, HookGroup[]> } & Record<string, unknown>;

export class UnreadableSettings extends DomainError {
  constructor(path: string) {
    super('unreadableSettings', `The settings ${path} are not valid JSON, they are left untouched`);
  }
}

/** Un hook de Bosco : son adresse désigne l'entrée des hooks de ce profil, quel que soit le port. */
function isBoscoHook(hook: unknown, endpoint: HookEndpoint): boolean {
  if (typeof hook !== 'object' || hook === null) return false;
  const { url } = hook as { url?: unknown };
  return typeof url === 'string' && url.endsWith(new URL(endpoint.url).pathname);
}

function withoutBosco(settings: Settings, endpoint: HookEndpoint): Settings {
  const hooks: Record<string, HookGroup[]> = {};
  for (const [event, groups] of Object.entries(settings.hooks ?? {})) {
    const kept = groups
      .map((group) => ({ ...group, hooks: (group.hooks ?? []).filter((hook) => !isBoscoHook(hook, endpoint)) }))
      .filter((group) => group.hooks.length > 0);
    if (kept.length > 0) hooks[event] = kept;
  }
  const rest = { ...settings };
  delete rest.hooks;
  return Object.keys(hooks).length > 0 ? { ...rest, hooks } : rest;
}

export class FileProfileSettings implements ProfileSettings {
  async install(profilePath: string, endpoint: HookEndpoint, backup: boolean): Promise<{ backupPath: null | string }> {
    const path = join(profilePath, 'settings.json');
    const current = await this.read(path);
    const settings = withoutBosco(current, endpoint);
    let backupPath: null | string = null;
    if (backup && (await this.exists(path))) {
      backupPath = `${path}.bosco-backup`;
      await copyFile(path, backupPath);
    }
    const hook = { type: 'http', url: endpoint.url, headers: { Authorization: `Bearer ${endpoint.secret}` } };
    const hooks = { ...settings.hooks };
    for (const event of LIVE_TRACKING_EVENTS) hooks[event] = [...(hooks[event] ?? []), { hooks: [hook] }];
    await this.write(path, { ...settings, hooks });
    return { backupPath };
  }

  async isInstalled(profilePath: string, endpoint: HookEndpoint): Promise<boolean> {
    let settings: Settings;
    try {
      settings = await this.read(join(profilePath, 'settings.json'));
    } catch {
      return false;
    }
    const groupsOf = (event: string): HookGroup[] => settings.hooks?.[event] ?? [];
    return LIVE_TRACKING_EVENTS.every((event) =>
      groupsOf(event).some((group) => (group.hooks ?? []).some((hook) => isBoscoHook(hook, endpoint))),
    );
  }

  async uninstall(profilePath: string, endpoint: HookEndpoint): Promise<void> {
    const path = join(profilePath, 'settings.json');
    if (!(await this.exists(path))) return;
    const settings = await this.read(path);
    await this.write(path, withoutBosco(settings, endpoint));
  }

  private async exists(path: string): Promise<boolean> {
    return readFile(path).then(
      () => true,
      () => false,
    );
  }

  private async read(path: string): Promise<Settings> {
    let content: string;
    try {
      content = await readFile(path, 'utf8');
    } catch {
      return {};
    }
    try {
      const parsed: unknown = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed as Settings;
    } catch {
      // traité ci-dessous
    }
    throw new UnreadableSettings(path);
  }

  /** Écriture d'un bloc : Claude Code ne lit jamais un fichier à moitié écrit. */
  private async write(path: string, settings: Settings): Promise<void> {
    const temporary = `${path}.bosco-${process.pid}`;
    await writeFile(temporary, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, path);
  }
}
