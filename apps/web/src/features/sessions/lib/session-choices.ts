import type { PilotSettingsDto, SessionDefaultsDto, SessionDefaultsResolvedDto } from '@bosco/domain';
import { originLabel } from '@/shared/lib/session-settings';
import type { SettingDefault, SettingsDefaults } from '../components/composer';

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
function fallbackOf(resolved: SessionDefaultsResolvedDto[keyof SessionChoices]): SettingDefault {
  return {
    origin: resolved.origin.level === 'claudeProfile' ? null : originLabel(resolved.origin),
    value: resolved.value,
  };
}

/**
 * Ce que la barre d'outils dit des valeurs par défaut : les autorisations, le modèle et l'effort qu'une session prend
 * sans choix, sous l'option « Défaut : … » de leur menu. Avant la réponse de Bosco, « Défaut » sans valeur.
 */
export function settingsDefaults(defaults: SessionDefaultsResolvedDto | undefined): SettingsDefaults {
  if (!defaults) return { permissionMode: { origin: null, value: null } };
  return {
    effort: fallbackOf(defaults.effort),
    model: fallbackOf(defaults.model),
    permissionMode: fallbackOf(defaults.permissionMode),
  };
}
