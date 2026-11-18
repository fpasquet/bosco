// Réglages d'un profil Claude Code (<profil>/settings.json) : Bosco ajoute ses hooks HTTP à ceux qui existent, sans
// toucher aux autres. Un seul Bosco suit un profil : installer le suivi remplace les hooks d'un autre Bosco du poste
// (le service de développement, l'application du poste…), qui échoueraient quand il est arrêté.
// Désinstaller ne retire que les siens. Un fichier illisible n'est jamais réécrit.
import { copyFile, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  ClaudeProfileDefaults,
  HookEndpoint,
  LiveTrackingInstallation,
  ProfileSettings,
} from '../../application/ports.ts';
import { DomainError } from '../../../shared/domain/domain-error.ts';
import {
  effortOf,
  NO_DEFAULTS,
  type PermissionMode,
  permissionModeOf,
  type SessionDefaults,
} from '../../../shared/domain/session-settings.ts';
import { LIVE_TRACKING_EVENTS } from '../../application/live-tracking.service.ts';

type HookGroup = { hooks?: unknown[]; matcher?: string } & Record<string, unknown>;
type Settings = { hooks?: Record<string, HookGroup[]> } & Record<string, unknown>;

export class UnreadableSettings extends DomainError {
  constructor(path: string) {
    super('unreadableSettings', `The settings ${path} are not valid JSON, they are left untouched`);
  }
}

function hookUrl(hook: unknown): null | URL {
  if (typeof hook !== 'object' || hook === null) return null;
  const { type, url } = hook as { type?: unknown; url?: unknown };
  return type === 'http' && typeof url === 'string' && URL.canParse(url) ? new URL(url) : null;
}

function authorizationOf(hook: unknown): null | string {
  const headers = (hook as { headers?: unknown }).headers;
  if (typeof headers !== 'object' || headers === null) return null;
  const value = (headers as Record<string, unknown>).Authorization;
  return typeof value === 'string' ? value : null;
}

/** Un hook de ce Bosco pour ce profil : son adresse désigne l'entrée des hooks du profil, quel que soit le port. */
function isOwnHook(hook: unknown, endpoint: HookEndpoint): boolean {
  return hookUrl(hook)?.pathname === new URL(endpoint.url).pathname;
}

/** Un hook d'un Bosco du poste, celui-ci ou un autre : l'entrée des hooks d'un service sur la boucle locale. */
function isAnyBoscoHook(hook: unknown): boolean {
  const url = hookUrl(hook);
  return !!url && ['127.0.0.1', 'localhost'].includes(url.hostname) && /^\/api\/hooks\/[\w-]+$/.test(url.pathname);
}

function withoutBosco(settings: Settings, isBoscoHook: (hook: unknown) => boolean): Settings {
  const hooks: Record<string, HookGroup[]> = {};
  for (const [event, groups] of Object.entries(settings.hooks ?? {})) {
    const kept = groups
      .map((group) => ({ ...group, hooks: (group.hooks ?? []).filter((hook) => !isBoscoHook(hook)) }))
      .filter((group) => group.hooks.length > 0);
    if (kept.length > 0) hooks[event] = kept;
  }
  const rest = { ...settings };
  delete rest.hooks;
  return Object.keys(hooks).length > 0 ? { ...rest, hooks } : rest;
}

/** Mode d'autorisations de Claude Code (permissions.defaultMode) tel que Bosco le nomme ; dontAsk n'est pas proposé. */
function modeOf(value: unknown): null | PermissionMode {
  return value === 'default' || value === 'manual' ? 'ask' : permissionModeOf(value);
}

export class FileProfileSettings implements ProfileSettings, ClaudeProfileDefaults {
  /** Mode, modèle et effort que règle le profil (permissions.defaultMode, model, effortLevel) ; illisible : aucun. */
  async sessionDefaults(profilePath: string): Promise<SessionDefaults> {
    let settings: Settings;
    try {
      settings = await this.read(join(profilePath, 'settings.json'));
    } catch {
      return NO_DEFAULTS;
    }
    const { effortLevel, model, permissions } = settings as Settings & {
      effortLevel?: unknown;
      model?: unknown;
      permissions?: { defaultMode?: unknown };
    };
    return {
      effort: effortOf(effortLevel),
      model: typeof model === 'string' && model.trim() ? model.trim() : null,
      permissionMode: modeOf(permissions?.defaultMode),
    };
  }

  async install(profilePath: string, endpoint: HookEndpoint, backup: boolean): Promise<{ backupPath: null | string }> {
    const path = join(profilePath, 'settings.json');
    const current = await this.read(path);
    const settings = withoutBosco(current, isAnyBoscoHook);
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

  async installation(profilePath: string, endpoint: HookEndpoint): Promise<LiveTrackingInstallation> {
    let settings: Settings;
    try {
      settings = await this.read(join(profilePath, 'settings.json'));
    } catch {
      return 'missing';
    }
    const groups = Object.entries(settings.hooks ?? {});
    const own = groups.flatMap(([event, eventGroups]) =>
      eventGroups.flatMap((group) =>
        (group.hooks ?? []).filter((hook) => isOwnHook(hook, endpoint)).map((hook) => ({ event, hook })),
      ),
    );
    if (own.length === 0) return 'missing';
    // À jour : chaque événement suivi appelle ce Bosco, sur son port et avec son secret, et rien d'autre ne reste
    const current = (hook: unknown) =>
      hookUrl(hook)?.href === endpoint.url && authorizationOf(hook) === `Bearer ${endpoint.secret}`;
    const followed = new Set<string>(LIVE_TRACKING_EVENTS);
    const upToDate =
      own.every(({ event, hook }) => followed.has(event) && current(hook)) &&
      LIVE_TRACKING_EVENTS.every((event) => own.some((entry) => entry.event === event));
    return upToDate ? 'installed' : 'outdated';
  }

  async uninstall(profilePath: string, endpoint: HookEndpoint): Promise<void> {
    const path = join(profilePath, 'settings.json');
    if (!(await this.exists(path))) return;
    const settings = await this.read(path);
    await this.write(
      path,
      withoutBosco(settings, (hook) => isOwnHook(hook, endpoint)),
    );
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
