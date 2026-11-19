import type { EffortDto, PermissionModeDto, PilotSettingsDto } from '@bosco/domain';
import {
  AUTO_MODE_UNAVAILABLE,
  EFFORT_CHOICES,
  effortName,
  MODEL_CHOICES,
  modelChoice,
  modelName,
  PERMISSION_MODE_OPTIONS,
  type PermissionModeOption,
  permissionModeOption,
  supportsAutoMode,
} from '@/shared/lib/session-settings';

/**
 * Réglages que montre la barre d'outils : des autorisations, un modèle ou un effort null cochent « Défaut : … », la
 * valeur par défaut d'une nouvelle session.
 */
export type ToolbarSettings = Omit<PilotSettingsDto, 'permissionMode'> & { permissionMode: null | PermissionModeDto };

/** Un choix d'un menu de la barre d'outils ; `default` tient lieu de null (la valeur par défaut). */
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

/**
 * Valeur par défaut d'un réglage d'une nouvelle session, prise tant que la personne n'en choisit pas : la valeur (null :
 * inconnue) et le niveau de Bosco qui la règle (« défaut du projet maison » ; null : rien à en dire).
 */
export interface SettingDefault {
  origin: null | string;
  value: null | string;
}

/** Première option d'un menu : « Défaut : Opus 5.5 » quand la valeur par défaut se connaît, avec son origine. */
function defaultOption(value: null | string, origin: null | string | undefined): SettingOption {
  return {
    value: DEFAULT_VALUE,
    label: value ? `Défaut : ${value}` : 'Défaut',
    ...(origin && { description: origin }),
  };
}

/** Nom du mode par défaut d'une nouvelle session : « Demander » ; null tant qu'il ne se connaît pas. */
function permissionName(fallback: SettingDefault): null | string {
  return fallback.value ? permissionModeOption(fallback.value as PermissionModeDto).label : null;
}

/**
 * Les cinq modes ; « Approuver pour moi » grisé quand le modèle choisi ne le permet pas. Une nouvelle session commence
 * par « Défaut : Demander » ; une session lancée a toujours un mode, sans défaut à cocher.
 */
export function permissionOptions(model: null | string, fallback?: SettingDefault): SettingOption[] {
  const auto = supportsAutoMode(model);
  return [
    ...(fallback ? [defaultOption(permissionName(fallback), fallback.origin)] : []),
    ...PERMISSION_MODE_OPTIONS.map(({ description, icon, label, risky, value }) => ({
      description,
      icon,
      label,
      risky,
      value,
      ...(value === 'auto' && !auto && { disabledReason: AUTO_MODE_UNAVAILABLE }),
    })),
  ];
}

/** Un effort tel qu'il se dit dans une phrase : « élevé ». */
export function effortWord(effort: string): string {
  return effortName(effort as EffortDto).toLowerCase();
}

export function modelOptions(fallback?: SettingDefault): SettingOption[] {
  return [
    defaultOption(fallback?.value ? modelName(fallback.value) : null, fallback?.origin),
    ...MODEL_CHOICES.map(({ label, value }) => ({ label, value })),
  ];
}

export function effortOptions(fallback?: SettingDefault): SettingOption[] {
  return [
    defaultOption(fallback?.value ? effortWord(fallback.value) : null, fallback?.origin),
    ...EFFORT_CHOICES.map(({ label, value }) => ({ label, value })),
  ];
}

const EFFORTS = new Set<string>(EFFORT_CHOICES.map(({ value }) => value));
const PERMISSION_MODES = new Set<string>(PERMISSION_MODE_OPTIONS.map(({ value }) => value));

/** Mode que prendra le tour : celui choisi, sinon celui par défaut (« Demander » tant qu'il ne se connaît pas). */
export function permissionMode(settings: ToolbarSettings, fallback?: SettingDefault): PermissionModeDto {
  return settings.permissionMode ?? (fallback?.value as null | PermissionModeDto) ?? 'ask';
}

/** Texte du bouton des autorisations : le mode choisi, sinon « Défaut : Demander », ou « Défaut » sans valeur connue. */
export function permissionLabel(settings: ToolbarSettings, fallback?: SettingDefault): string {
  if (settings.permissionMode) return permissionModeOption(settings.permissionMode).label;
  const name = fallback && permissionName(fallback);
  return name ? `Défaut : ${name}` : 'Défaut';
}

/**
 * Texte du bouton du modèle : le modèle choisi (alias de Claude Code compris, « opus » : « Opus 5.5 »), sinon
 * « Défaut : Opus 5.5 », ou « Défaut » quand la valeur par défaut ne se connaît pas.
 */
export function modelLabel(settings: ToolbarSettings, fallback?: SettingDefault): string {
  if (settings.model) return modelName(settings.model);
  return fallback?.value ? `Défaut : ${modelName(fallback.value)}` : 'Défaut';
}

/** Option cochée du menu des modèles : celle que désigne le modèle, même par un alias de Claude Code. */
export function modelValue(settings: ToolbarSettings): string {
  return modelChoice(settings.model)?.value ?? settings.model ?? DEFAULT_VALUE;
}

/** Texte du bouton de l'effort : « Effort : élevé » choisi, « Défaut : effort élevé », ou « Effort : défaut ». */
export function effortLabel(settings: ToolbarSettings, fallback?: SettingDefault): string {
  if (settings.effort) return `Effort : ${effortWord(settings.effort)}`;
  return fallback?.value ? `Défaut : effort ${effortWord(fallback.value)}` : 'Effort : défaut';
}

/**
 * Nom accessible d'un bouton : son texte visible, précédé du réglage s'il ne le dit pas (« Modèle : Défaut : Sonnet
 * 5.5 »), puis l'origine d'une valeur par défaut (« défaut du projet maison »).
 */
export function spokenLabel(title: string, label: string, origin: null | string | undefined): string {
  const named = label.startsWith(title) ? label : `${title} : ${label}`;
  return origin ? `${named}, ${origin}` : named;
}

export function withPermissionMode(settings: ToolbarSettings, value: string): ToolbarSettings {
  if (value === DEFAULT_VALUE) return { ...settings, permissionMode: null };
  if (!PERMISSION_MODES.has(value)) return settings;
  return { ...settings, permissionMode: value as PermissionModeDto };
}

export function withModel(settings: ToolbarSettings, value: string): ToolbarSettings {
  return { ...settings, model: value === DEFAULT_VALUE ? null : value };
}

export function withEffort(settings: ToolbarSettings, value: string): ToolbarSettings {
  return { ...settings, effort: EFFORTS.has(value) ? (value as EffortDto) : null };
}
