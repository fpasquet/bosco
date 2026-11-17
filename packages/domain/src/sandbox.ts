// Isolation des bacs à sable et abonnement Claude (E11) : la sortie réseau, l'abonnement par défaut et son quota.

/** Profil Claude Code qui a un accès à l'abonnement, avec son compte. */
export interface ClaudeProfileDto {
  account: null | string;
  label: string;
  path: string;
}

/** Abonnement Claude par défaut : celui que prend une nouvelle session qui n'en choisit pas d'autre. */
export interface SubscriptionDto {
  account: null | string;
  /** Un accès à l'abonnement existe : sans lui, aucun bac à sable ne démarre */
  available: boolean;
  choices: ClaudeProfileDto[];
  label: null | string;
  profile: null | string;
}

/** Isolation des bacs à sable (E11) : image et limites de l'agent, domaines joints par le proxy de sortie. */
export interface IsolationDto {
  domains: { added: string[]; locked: string[] };
  image: string;
  limits: { cpus: number; memory: number; processes: number };
  subscription: SubscriptionDto;
}

/** Une fenêtre du quota de l'abonnement : sa part utilisée, en %, et sa remise à zéro. */
export interface QuotaWindowDto {
  resetsAt: string;
  usage: number;
}

/** Seuils du quota, en % : au-delà de l'attente, aucun tour ne part ; au-delà de l'arrêt, le tour en cours s'arrête. */
export interface QuotaThresholdsDto {
  fiveHour: { stop: number; wait: number };
  sevenDay: { stop: number; wait: number };
}

/** Sessions que les seuils retiennent : en bac à sable seulement, ou aussi celles pilotées sur le poste. */
export type QuotaScopeDto = 'all' | 'sandbox';

/** Quota de l'abonnement (E11, DT-39) : l'usage de chaque abonnement, les seuils et leur portée. */
export interface QuotaDto {
  scope: QuotaScopeDto;
  subscriptions: { fiveHour: null | QuotaWindowDto; label: string; path: string; sevenDay: null | QuotaWindowDto }[];
  thresholds: QuotaThresholdsDto;
}
