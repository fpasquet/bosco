/**
 * Réglages d'une session pilotée que règlent aussi un profil, un projet ou un groupe : le mode d'autorisations, le
 * modèle et l'effort. Partagés par les contextes qui les gardent (projets, groupes, profils) et celui qui les résout.
 */

/**
 * Mode d'autorisations : Demander, Accepter les modifications, Plan, Approuver pour moi (le vérificateur de Claude
 * Code) et Accès complet (aucune demande).
 */
export type PermissionMode = 'acceptEdits' | 'ask' | 'auto' | 'bypassPermissions' | 'plan';

export const PERMISSION_MODES: readonly PermissionMode[] = ['ask', 'acceptEdits', 'plan', 'auto', 'bypassPermissions'];

/** Effort de l'agent. */
export type Effort = 'high' | 'low' | 'max' | 'medium' | 'xhigh';

export const EFFORTS: readonly Effort[] = ['low', 'medium', 'high', 'xhigh', 'max'];

/** Valeurs par défaut d'un niveau ; null : il n'en règle pas, la valeur vient du niveau suivant. */
export interface SessionDefaults {
  effort: Effort | null;
  model: null | string;
  permissionMode: null | PermissionMode;
}

export const NO_DEFAULTS: SessionDefaults = { effort: null, model: null, permissionMode: null };

/** Ce qu'un niveau change de ses valeurs : un champ absent reste tel quel, null le rend hérité. */
export type SessionDefaultsChanges = Partial<SessionDefaults>;

/** Applique des changements ; un modèle vide redevient hérité. */
export function changedDefaults(current: SessionDefaults, changes: SessionDefaultsChanges): SessionDefaults {
  return {
    effort: changes.effort === undefined ? current.effort : changes.effort,
    model: changes.model === undefined ? current.model : changes.model?.trim() || null,
    permissionMode: changes.permissionMode === undefined ? current.permissionMode : changes.permissionMode,
  };
}

/** Lit un mode venu d'ailleurs (base, réglages de Claude Code) ; inconnu, il est ignoré. */
export function permissionModeOf(value: unknown): null | PermissionMode {
  return PERMISSION_MODES.find((mode) => mode === value) ?? null;
}

export function effortOf(value: unknown): Effort | null {
  return EFFORTS.find((effort) => effort === value) ?? null;
}

/** Valeurs par défaut d'un projet ou d'un groupe : le profil de ses sessions en plus ; null : hériter. */
export interface LevelDefaults extends SessionDefaults {
  profile: null | string;
}

export const NO_LEVEL_DEFAULTS: LevelDefaults = { ...NO_DEFAULTS, profile: null };

/** Applique des changements à un projet ou un groupe ; un profil vide redevient hérité. */
export function changedLevelDefaults(current: LevelDefaults, changes: Partial<LevelDefaults>): LevelDefaults {
  return {
    ...changedDefaults(current, changes),
    profile: changes.profile === undefined ? current.profile : changes.profile?.trim() || null,
  };
}
