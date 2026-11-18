import type { PilotSettingsDto, SessionDefaultsDto, SessionDefaultsResolvedDto } from '@bosco/domain';
import { originLabel } from '@/shared/lib/session-settings';

/** Réglages choisis pour une nouvelle session ; null : celui des valeurs par défaut. */
export type SessionChoices = Omit<SessionDefaultsDto, 'profile'>;

export const NO_CHOICES: SessionChoices = { effort: null, model: null, permissionMode: null };

type Key = keyof SessionChoices;

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

/** D'où vient chaque réglage : « choisi pour cette session », ou l'origine de la valeur par défaut. */
export function settingsOrigins(
  chosen: SessionChoices,
  defaults: SessionDefaultsResolvedDto | undefined,
): Record<Key, null | string> {
  const origin = (key: Key) => {
    if (chosen[key] !== null) return 'choisi pour cette session';
    return defaults ? originLabel(defaults[key].origin) : null;
  };
  return { effort: origin('effort'), model: origin('model'), permissionMode: origin('permissionMode') };
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
