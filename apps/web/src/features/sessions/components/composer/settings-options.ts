import type { EffortDto, PilotSettingsDto } from '@bosco/domain';
import {
  AUTO_MODE_UNAVAILABLE,
  EFFORT_CHOICES,
  MODEL_CHOICES,
  modelChoice,
  modelName,
  PERMISSION_MODE_OPTIONS,
  type PermissionModeOption,
  permissionModeOption,
  supportsAutoMode,
} from '@/shared/lib/session-settings';

/** Un choix d'un menu de la barre d'outils ; `default` tient lieu de null (réglage du profil). */
export interface SettingOption {
  description?: string;
  /** Grisé, avec sa raison (« Pas disponible avec ce modèle ») */
  disabledReason?: string;
  icon?: PermissionModeOption['icon'];
  label: string;
  /** Accès complet : en orange */
  risky?: boolean;
  value: string;
}

/** Valeur des menus pour un réglage laissé au profil (null) : Radix ne prend que des chaînes. */
export const DEFAULT_VALUE = 'default';

/** Les cinq modes ; « Approuver pour moi » grisé quand le modèle choisi ne le permet pas. */
export function permissionOptions(model: null | string): SettingOption[] {
  const auto = supportsAutoMode(model);
  return PERMISSION_MODE_OPTIONS.map(({ description, icon, label, risky, value }) => ({
    description,
    icon,
    label,
    risky,
    value,
    ...(value === 'auto' && !auto && { disabledReason: AUTO_MODE_UNAVAILABLE }),
  }));
}

export const MODEL_OPTIONS: SettingOption[] = [
  { value: DEFAULT_VALUE, label: 'Défaut du profil' },
  ...MODEL_CHOICES.map(({ label, value }) => ({ label, value })),
];

export const EFFORT_OPTIONS: SettingOption[] = [
  { value: DEFAULT_VALUE, label: 'Effort : défaut' },
  ...EFFORT_CHOICES.map(({ label, value }) => ({ label, value })),
];

const EFFORTS = new Set<string>(EFFORT_CHOICES.map(({ value }) => value));
const PERMISSION_MODES = new Set<string>(PERMISSION_MODE_OPTIONS.map(({ value }) => value));

function labelOf(options: SettingOption[], value: string): string | undefined {
  return options.find((option) => option.value === value)?.label;
}

export function permissionLabel(settings: PilotSettingsDto): string {
  return permissionModeOption(settings.permissionMode).label;
}

/** Libellé court du modèle, alias de Claude Code compris (« opus » : « Opus 5.5 ») ; un modèle inconnu reste tel quel. */
export function modelLabel(settings: PilotSettingsDto): string {
  return modelName(settings.model);
}

/** Option cochée du menu des modèles : celle que désigne le modèle, même par un alias de Claude Code. */
export function modelValue(settings: PilotSettingsDto): string {
  return modelChoice(settings.model)?.value ?? settings.model ?? DEFAULT_VALUE;
}

export function effortLabel(settings: PilotSettingsDto): string {
  if (!settings.effort) return 'Effort : défaut';
  return `Effort : ${(labelOf(EFFORT_OPTIONS, settings.effort) ?? settings.effort).toLowerCase()}`;
}

export function withPermissionMode(settings: PilotSettingsDto, value: string): PilotSettingsDto {
  if (!PERMISSION_MODES.has(value)) return settings;
  return { ...settings, permissionMode: value as PilotSettingsDto['permissionMode'] };
}

export function withModel(settings: PilotSettingsDto, value: string): PilotSettingsDto {
  return { ...settings, model: value === DEFAULT_VALUE ? null : value };
}

export function withEffort(settings: PilotSettingsDto, value: string): PilotSettingsDto {
  return { ...settings, effort: EFFORTS.has(value) ? (value as EffortDto) : null };
}
