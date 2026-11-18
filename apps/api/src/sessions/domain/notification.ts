import { DomainError } from '../../shared/domain/domain-error.ts';

/**
 * Notifications : ce qui t'attend (autorisation, question de l'agent, fin de tour qui pose une
 * question) et ce qui est fini (tâche du worker à relire ou en échec, fin d'un long tour, session terminée).
 */
export type NotificationKind =
  'decision' | 'ended' | 'failed' | 'long-turn' | 'permission' | 'question' | 'review' | 'sandbox' | 'turn-question';

/** Ce qui attend une réponse : ces notifications passent en priorité haute et restent affichées. */
export const ASKING: readonly NotificationKind[] = ['permission', 'question', 'turn-question'];

/** Fin de tour sans question : jamais, seulement après un long tour, ou toujours. */
export type TurnNotification = 'always' | 'long' | 'never';

export interface NotificationSettings {
  ended: boolean;
  failed: boolean;
  /** Message bref au lieu de la notification du bureau quand l'onglet Bosco est au premier plan */
  inAppWhenForeground: boolean;
  /** Durée d'un tour, de ta demande à la main rendue, à partir de laquelle il est « long » (1 à 30 min) */
  longTurnMinutes: number;
  permission: boolean;
  question: boolean;
  review: boolean;
  turn: TurnNotification;
  turnQuestion: boolean;
}

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  ended: false,
  failed: true,
  inAppWhenForeground: true,
  longTurnMinutes: 2,
  permission: true,
  question: true,
  review: true,
  turn: 'long',
  turnQuestion: true,
};

export const LONG_TURN_MINUTES = { max: 30, min: 1 } as const;

export class InvalidNotificationSettings extends DomainError {
  constructor(message: string) {
    super('invalidSetting', message);
  }
}

export function checkNotificationSettings(settings: NotificationSettings): void {
  const { longTurnMinutes, turn } = settings;
  if (!['always', 'long', 'never'].includes(turn))
    throw new InvalidNotificationSettings('Fin de tour : Jamais, Après un long tour ou Toujours.');
  if (
    !Number.isInteger(longTurnMinutes) ||
    longTurnMinutes < LONG_TURN_MINUTES.min ||
    longTurnMinutes > LONG_TURN_MINUTES.max
  )
    throw new InvalidNotificationSettings(
      `Un long tour dure de ${LONG_TURN_MINUTES.min} à ${LONG_TURN_MINUTES.max} minutes.`,
    );
}

/**
 * Le dernier message de l'agent finit-il par une question ? Un point d'interrogation final, guillemets, emphase ou
 * parenthèse fermante comprise : « Veux-tu que je lance les tests ? ». Une heuristique, assumée comme telle.
 */
export function endsWithQuestion(message: null | string): boolean {
  if (!message) return false;
  return /\?[\s»"'”*_)\]`]*$/.test(message.trim());
}

/** Ce qui vient d'arriver, avant de savoir s'il mérite une notification. */
export type NotificationEvent =
  | { kind: 'ended' | 'failed' | 'permission' | 'question' | 'review' }
  /** Bac à sable supprimé demain avec du travail non récupéré : toujours notifié */
  | { kind: 'sandbox' }
  /** Décision proposée par un agent, à valider : toujours notifiée, les réglages n'en ont pas */
  | { kind: 'decision' }
  | { kind: 'turn'; message: null | string; minutes: null | number };

/**
 * Type de la notification à envoyer pour cet événement selon les réglages, ou null s'il n'en mérite pas. Une fin
 * de tour qui pose une question est une question ; sinon, elle ne compte que si le tour a été long, ou toujours
 * selon le réglage. Un tour de durée inconnue (Bosco redémarré) compte comme long.
 */
export function notificationOf(event: NotificationEvent, settings: NotificationSettings): NotificationKind | null {
  if (event.kind === 'sandbox' || event.kind === 'decision') return event.kind;
  if (event.kind !== 'turn') return settings[event.kind] ? event.kind : null;
  if (endsWithQuestion(event.message)) return settings.turnQuestion ? 'turn-question' : null;
  if (settings.turn === 'never') return null;
  if (settings.turn === 'always') return 'long-turn';
  return event.minutes === null || event.minutes >= settings.longTurnMinutes ? 'long-turn' : null;
}

/** Une notification gardée 7 jours dans le centre de notifications. */
export interface NotificationRecord {
  at: Date;
  /** Décision proposée à valider ; elle s'ouvre au clic */
  decisionId: null | number;
  excerpt: null | string;
  id: number;
  kind: NotificationKind;
  readAt: Date | null;
  sessionId: null | string;
  /** Traitée : répondue, relue, relancée ; elle sort de « À traiter » */
  settled: null | string;
  taskId: null | number;
  /** Projet de la session ou de la tâche (« site-perso ») : il titre la notification du bureau */
  place: null | string;
  /** Session ou tâche concernée (« Ajouter les catégories au budget du foyer ») */
  title: string;
  /** Durée du tour, pour une fin de long tour */
  turnMinutes: null | number;
}

export const NOTIFICATION_RETENTION_DAYS = 7;

/** Longueur au-delà de laquelle l'extrait d'un message ne garde que ses dernières phrases */
export const EXCERPT_MAX = 180;

/** Le Markdown d'un message en texte simple, sur une ligne : la notification et le tiroir ne l'interprètent pas. */
export function plainText(markdown: string): string {
  return markdown
    .replaceAll(/```\w*/g, '')
    .replaceAll(/\]\([^)\s]*\)/g, ']')
    .replaceAll('![', '[')
    .replaceAll(/\[([^\]\n]{0,200})\]/g, '$1')
    .replaceAll('`', '')
    .replaceAll('**', '')
    .replaceAll(/(^|\s)\*([^*\s][^*]*)\*/g, '$1$2')
    .replaceAll(/^\s{0,3}(?:#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

/**
 * Extrait de la fin d'un message, là où l'agent conclut ou pose sa question : ses dernières phrases entières (une
 * phrase s'arrête aussi à un point-virgule ou à deux-points), sans Markdown. Une dernière phrase trop longue garde sa
 * fin, depuis le début d'un mot.
 */
export function messageExcerpt(message: null | string): null | string {
  if (!message) return null;
  const text = plainText(message);
  if (text.length <= EXCERPT_MAX) return text || null;
  const clauses = text.split(/(?<=[.!?;:…])\s+/);
  let excerpt = '';
  for (const clause of clauses.toReversed()) {
    const longer = excerpt ? `${clause} ${excerpt}` : clause;
    if (longer.length > EXCERPT_MAX) break;
    excerpt = longer;
  }
  if (!excerpt) {
    const tail = text.slice(-(EXCERPT_MAX - 1));
    return `…${tail.slice(tail.indexOf(' ') + 1)}`;
  }
  return excerpt.charAt(0).toLocaleUpperCase('fr') + excerpt.slice(1);
}

/** Un titre coupé à la fin d'un mot, pour tenir sur une ligne. */
export function shortTitle(title: string, max: number): string {
  if (title.length <= max) return title;
  const cut = title.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  let kept = space > 0 ? cut.slice(0, space) : cut;
  while (kept && ' ,;:.·-'.includes(kept.at(-1) ?? '')) kept = kept.slice(0, -1);
  return `${kept}…`;
}

/** Libellé du type, en tête de la notification. */
export const KIND_LABELS: Record<NotificationKind, string> = {
  decision: 'Décision proposée',
  ended: 'Session terminée',
  failed: 'En échec',
  'long-turn': 'Fin de tour',
  permission: 'Autorisation',
  question: 'Question de l’agent',
  review: 'À relire',
  sandbox: 'Bac à sable',
  'turn-question': 'Question',
};
