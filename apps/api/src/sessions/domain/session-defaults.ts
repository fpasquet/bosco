import type { Effort, PermissionMode, SessionDefaults } from '../../shared/domain/session-settings.ts';
import type { PilotSettings } from './pilot.ts';

/**
 * D'où vient une valeur d'une nouvelle session : le choix fait pour elle, le groupe choisi, le projet principal, les
 * réglages du profil gardés par Bosco, ce que dit le profil Claude Code, le mode d'un bac à sable sans réglage, ou le
 * profil par défaut de Bosco pour le profil lui-même.
 */
export type DefaultOrigin =
  | { level: 'claudeProfile' }
  | { level: 'defaultProfile' }
  | { level: 'group'; name: string }
  | { level: 'none' }
  | { level: 'profile'; name: string }
  | { level: 'project'; name: string }
  | { level: 'sandbox' }
  | { level: 'session' };

export interface Resolved<T> {
  origin: DefaultOrigin;
  value: T;
}

/** Un niveau nommé et les valeurs qu'il règle ; null quand il n'existe pas pour cette session (ni groupe, ni projet). */
export interface DefaultsLevel {
  defaults: SessionDefaults;
  name: string;
}

/** Ce qui décide du profil d'une nouvelle session, du plus fort au plus faible. */
export interface ProfileLevels {
  /** Profils qu'une session peut prendre (surveillés, avec un accès) : un réglage hors de cette liste est passé */
  available: readonly string[];
  chosen: null | string;
  /** Profil par défaut de Bosco (« Abonnement Claude ») */
  defaultProfile: null | string;
  group: null | { name: string; profile: null | string };
  project: null | { name: string; profile: null | string };
}

/**
 * Profil d'une nouvelle session : le choix de la session, puis le groupe choisi, puis le projet principal, puis le
 * profil par défaut ; à défaut de tout, le premier profil possible, sans origine.
 */
export function resolveProfile(levels: ProfileLevels): Resolved<null | string> {
  const usable = (profile: null | string | undefined): profile is string =>
    !!profile && levels.available.includes(profile);
  if (usable(levels.chosen)) return { value: levels.chosen, origin: { level: 'session' } };
  if (levels.group && usable(levels.group.profile))
    return { value: levels.group.profile, origin: { level: 'group', name: levels.group.name } };
  if (levels.project && usable(levels.project.profile))
    return { value: levels.project.profile, origin: { level: 'project', name: levels.project.name } };
  if (usable(levels.defaultProfile)) return { value: levels.defaultProfile, origin: { level: 'defaultProfile' } };
  return { value: levels.available[0] ?? null, origin: { level: 'none' } };
}

/** Ce qui décide des réglages du tour d'une nouvelle session, une fois son profil connu. */
export interface SettingsLevels {
  chosen: SessionDefaults;
  /** Ce que dit le profil Claude Code (son settings.json), lu sans être modifié */
  claude: SessionDefaults;
  group: DefaultsLevel | null;
  /** Réglages du profil gardés par Bosco ; name : le nom court du profil (« pro ») */
  profile: DefaultsLevel | null;
  project: DefaultsLevel | null;
  /** Dans un bac à sable, l'agent ne voit pas le profil Claude Code, et le mode sans réglage est « Accepter les modifications » */
  sandboxed: boolean;
}

export interface ResolvedSettings {
  effort: Resolved<Effort | null>;
  /** null : le modèle que choisit Claude Code */
  model: Resolved<null | string>;
  permissionMode: Resolved<PermissionMode>;
}

type Key = keyof SessionDefaults;

/** Premier niveau qui règle la valeur, dans l'ordre : session, groupe, projet, profil de Bosco. */
function firstSet<K extends Key>(levels: SettingsLevels, key: K): null | Resolved<NonNullable<SessionDefaults[K]>> {
  const named: [DefaultsLevel | null, 'group' | 'profile' | 'project'][] = [
    [levels.group, 'group'],
    [levels.project, 'project'],
    [levels.profile, 'profile'],
  ];
  const chosen = levels.chosen[key];
  if (chosen !== null) return { value: chosen, origin: { level: 'session' } };
  for (const [level, kind] of named) {
    const value = level?.defaults[key] ?? null;
    if (level && value !== null) return { value: value, origin: { level: kind, name: level.name } };
  }
  return null;
}

/**
 * Réglages d'une nouvelle session (règle 16) : chacun prend la valeur du premier niveau qui la règle (session, groupe
 * choisi, projet principal, profil réglé dans Bosco, profil Claude Code) et dit d'où elle vient. En bac à sable, sans
 * mode réglé dans Bosco, « Accepter les modifications » : l'agent n'y abîme que sa copie.
 */
export function resolveSettings(levels: SettingsLevels): ResolvedSettings {
  const claude = (value: unknown) => ({ value, origin: { level: 'claudeProfile' } as DefaultOrigin });
  const mode =
    firstSet(levels, 'permissionMode') ??
    (levels.sandboxed
      ? { value: 'acceptEdits' as PermissionMode, origin: { level: 'sandbox' } as DefaultOrigin }
      : (claude(levels.claude.permissionMode ?? 'ask') as Resolved<PermissionMode>));
  return {
    permissionMode: mode,
    model: firstSet(levels, 'model') ?? (claude(levels.claude.model) as Resolved<null | string>),
    effort: firstSet(levels, 'effort') ?? (claude(levels.claude.effort) as Resolved<Effort | null>),
  };
}

/** Réglages du premier tour, sans leur origine. */
export function settingsOf(resolved: ResolvedSettings): PilotSettings {
  return {
    effort: resolved.effort.value,
    model: resolved.model.value,
    permissionMode: resolved.permissionMode.value,
  };
}
