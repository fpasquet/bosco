import type { PilotSettingsDto, SessionDefaultsDto, SessionDefaultsResolvedDto } from '@bosco/domain';
import { originLabel } from '@/shared/lib/session-settings';

/** Réglages choisis pour une nouvelle session ; null : celui des valeurs par défaut. */
export type SessionChoices = Omit<SessionDefaultsDto, 'profile'>;

export const NO_CHOICES: SessionChoices = { effort: null, model: null, permissionMode: null };

/** Réglages du premier tour : le choix de la session, sinon la valeur par défaut (« Demander » tant qu'elle se lit). */
export function effectiveSettings(
  chosen: SessionChoices,
  defaults: SessionDefaultsResolvedDto | undefined,
): PilotSettingsDto {
  return {
    effort: chosen.effort ?? defaults?.effort.value ?? null,
    model: chosen.model ?? defaults?.model.value ?? null,
    permissionMode: chosen.permissionMode ?? defaults?.permissionMode.value ?? 'ask',
  };
}

/** Une valeur par défaut, et le niveau de Bosco qui la règle ; celle du profil Claude Code n'a pas d'origine à dire. */
function fallbackOf(resolved: SessionDefaultsResolvedDto['effort'] | SessionDefaultsResolvedDto['model']) {
  return {
    origin: resolved.origin.level === 'claudeProfile' ? null : originLabel(resolved.origin),
    value: resolved.value,
  };
}

/**
 * Ce que la barre d'outils dit des valeurs par défaut : le modèle et l'effort qu'une session prend sans choix, et d'où
 * viennent les autorisations (« choisi pour cette session », ou l'origine de leur valeur par défaut).
 */
export function settingsDefaults(chosen: SessionChoices, defaults: SessionDefaultsResolvedDto | undefined) {
  if (!defaults) return { permissionMode: chosen.permissionMode === null ? null : 'choisi pour cette session' };
  return {
    effort: fallbackOf(defaults.effort),
    model: fallbackOf(defaults.model),
    permissionMode:
      chosen.permissionMode === null ? originLabel(defaults.permissionMode.origin) : 'choisi pour cette session',
  };
}

/** Réglages que montre la barre d'outils : le modèle et l'effort choisis seulement, null cochant « Défaut : … ». */
export function shownSettings(chosen: SessionChoices, settings: PilotSettingsDto): PilotSettingsDto {
  return { ...settings, effort: chosen.effort, model: chosen.model };
}

/** Un réglage changé dans la barre d'outils devient un choix de la session ; les autres restent aux valeurs par défaut. */
export function choicesAfter(
  chosen: SessionChoices,
  current: PilotSettingsDto,
  next: PilotSettingsDto,
): SessionChoices {
  return {
    effort: next.effort === current.effort ? chosen.effort : next.effort,
    model: next.model === current.model ? chosen.model : next.model,
    permissionMode: next.permissionMode === current.permissionMode ? chosen.permissionMode : next.permissionMode,
  };
}
