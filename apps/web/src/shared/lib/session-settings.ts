import { FilePen, Hand, Map as MapIcon, ShieldAlert, ShieldCheck } from 'lucide-react';
import { APP_NAME, type DefaultOriginDto, type EffortDto, type PermissionModeDto } from '@bosco/domain';

/**
 * Réglages d'une session que règlent aussi un profil, un projet ou un groupe : les cinq modes d'autorisations avec leur
 * icône, les modèles proposés et les efforts, et l'origine d'une valeur par défaut, dite comme dans les maquettes.
 */

export interface PermissionModeOption {
  description: string;
  icon: typeof Hand;
  label: string;
  /** Accès complet : en orange, partout où il s'affiche */
  risky: boolean;
  value: PermissionModeDto;
}

export const PERMISSION_MODE_OPTIONS: readonly PermissionModeOption[] = [
  {
    value: 'ask',
    label: 'Demander',
    description: `Chaque autorisation arrive dans ${APP_NAME}.`,
    icon: Hand,
    risky: false,
  },
  {
    value: 'acceptEdits',
    label: 'Accepter les modifications',
    description: 'Les modifications de fichiers passent sans demander ; le reste est demandé.',
    icon: FilePen,
    risky: false,
  },
  {
    value: 'plan',
    label: 'Plan',
    description: 'L’agent propose un plan avant de toucher aux fichiers.',
    icon: MapIcon,
    risky: false,
  },
  {
    value: 'auto',
    label: 'Approuver pour moi',
    description: 'Un vérificateur examine chaque demande à ta place.',
    icon: ShieldCheck,
    risky: false,
  },
  {
    value: 'bypassPermissions',
    label: 'Accès complet',
    description: 'Aucune demande, ni pour les modifications ni pour les commandes.',
    icon: ShieldAlert,
    risky: true,
  },
];

/** Pourquoi « Approuver pour moi » est grisé avec un modèle qui ne le permet pas. */
export const AUTO_MODE_UNAVAILABLE = 'Pas disponible avec ce modèle';

export interface ModelOption {
  /** Le vérificateur d'« Approuver pour moi » tourne avec ce modèle (lu dans Claude Code 2.1.327) */
  autoMode: boolean;
  label: string;
  value: string;
}

export const MODEL_CHOICES: readonly ModelOption[] = [
  { value: 'claude-opus-5-5', label: 'Opus 5.5', autoMode: true },
  { value: 'claude-sonnet-5-5', label: 'Sonnet 5.5', autoMode: true },
  { value: 'claude-haiku-5-5', label: 'Haiku 5.5', autoMode: true },
  { value: 'claude-haiku-4-5', label: 'Haiku 4.5', autoMode: false },
];

export const EFFORT_CHOICES: readonly { label: string; value: EffortDto }[] = [
  { value: 'low', label: 'Faible' },
  { value: 'medium', label: 'Moyen' },
  { value: 'high', label: 'Élevé' },
  { value: 'xhigh', label: 'Très élevé' },
  { value: 'max', label: 'Maximal' },
];

export function permissionModeOption(mode: PermissionModeDto): PermissionModeOption {
  return (
    PERMISSION_MODE_OPTIONS.find(({ value }) => value === mode) ?? (PERMISSION_MODE_OPTIONS[0] as PermissionModeOption)
  );
}

/** « Approuver pour moi » marche avec ce modèle ; null (celui de Claude Code) ou un modèle inconnu : oui. */
export function supportsAutoMode(model: null | string): boolean {
  if (!model) return true;
  const known = MODEL_CHOICES.find(({ value }) => value === model || model.startsWith(value));
  if (known) return known.autoMode;
  return !/haiku-4|claude-3/.test(model);
}

/** Libellé court d'un modèle ; un identifiant inconnu des menus s'affiche tel quel, null : celui du profil. */
export function modelName(model: null | string): string {
  if (!model) return 'Défaut du profil';
  return MODEL_CHOICES.find(({ value }) => value === model)?.label ?? model;
}

export function effortName(effort: EffortDto | null): string {
  return effort ? (EFFORT_CHOICES.find(({ value }) => value === effort)?.label ?? effort) : 'défaut';
}

/**
 * Origine d'une valeur, telle que la disent les puces et les champs : « défaut du groupe », « défaut du projet
 * api-tarifs », « défaut du profil pro », « celui du profil Claude Code », « défaut en bac à sable ». `named` nomme le
 * groupe (« défaut du groupe Club des Trois Lacs »), `principal` dit que le projet est le principal d'un groupe ; null
 * quand la valeur n'a pas d'origine à dire.
 */
export function originLabel(
  origin: DefaultOriginDto,
  options: { named?: boolean; principal?: boolean } = {},
): null | string {
  switch (origin.level) {
    case 'session':
      return 'choisi pour cette session';
    case 'group':
      return options.named ? `défaut du groupe ${origin.name}` : 'défaut du groupe';
    case 'project':
      return options.principal ? `défaut du projet principal, ${origin.name}` : `défaut du projet ${origin.name}`;
    case 'profile':
      return `défaut du profil ${origin.name}`;
    case 'claudeProfile':
      return 'celui du profil Claude Code';
    case 'sandbox':
      return 'défaut en bac à sable';
    case 'defaultProfile':
      return 'profil par défaut';
    case 'none':
      return null;
  }
}
