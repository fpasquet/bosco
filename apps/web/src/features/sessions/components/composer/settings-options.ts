import { APP_NAME, type EffortDto, type PilotSettingsDto } from '@bosco/domain';

/** Un choix d'un menu de la barre d'outils ; `default` tient lieu de null (réglage du profil). */
export interface SettingOption {
  description?: string;
  label: string;
  value: string;
}

/** Valeur des menus pour un réglage laissé au profil (null) : Radix ne prend que des chaînes. */
export const DEFAULT_VALUE = 'default';

export const PERMISSION_OPTIONS: SettingOption[] = [
  { value: 'ask', label: 'Demander', description: `Chaque autorisation arrive dans ${APP_NAME}` },
  {
    value: 'acceptEdits',
    label: 'Accepter les modifications',
    description: 'Les modifications de fichiers passent sans demander',
  },
  { value: 'plan', label: 'Plan', description: 'L’agent propose un plan avant de toucher aux fichiers' },
];

export const MODEL_OPTIONS: SettingOption[] = [
  { value: DEFAULT_VALUE, label: 'Défaut du profil' },
  { value: 'claude-opus-5-5', label: 'Opus 5.5' },
  { value: 'claude-sonnet-5-5', label: 'Sonnet 5.5' },
  { value: 'claude-haiku-5-5', label: 'Haiku 5.5' },
];

export const EFFORT_OPTIONS: SettingOption[] = [
  { value: DEFAULT_VALUE, label: 'Effort : défaut' },
  { value: 'low', label: 'Faible' },
  { value: 'medium', label: 'Moyen' },
  { value: 'high', label: 'Élevé' },
  { value: 'xhigh', label: 'Très élevé' },
  { value: 'max', label: 'Maximal' },
];

const EFFORTS = new Set<string>(['high', 'low', 'max', 'medium', 'xhigh']);
const PERMISSION_MODES = new Set<string>(['acceptEdits', 'ask', 'plan']);

function labelOf(options: SettingOption[], value: string): string | undefined {
  return options.find((option) => option.value === value)?.label;
}

export function permissionLabel(settings: PilotSettingsDto): string {
  return labelOf(PERMISSION_OPTIONS, settings.permissionMode) ?? settings.permissionMode;
}

/** Libellé court du modèle ; un identifiant inconnu des menus s'affiche tel quel. */
export function modelLabel(settings: PilotSettingsDto): string {
  return labelOf(MODEL_OPTIONS, settings.model ?? DEFAULT_VALUE) ?? settings.model ?? '';
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
