import { DomainError } from '../../shared/domain/domain-error.ts';

/**
 * Notifications (E15, règle 8) : ce qui t'attend (autorisation, question de l'agent, fin de tour qui pose une
 * question) et ce qui est fini (tâche du worker à relire ou en échec, fin d'un long tour, session terminée).
 */
export type NotificationKind =
  'ended' | 'failed' | 'long-turn' | 'permission' | 'question' | 'review' | 'turn-question';

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
  | { kind: 'turn'; message: null | string; minutes: null | number };

/**
 * Type de la notification à envoyer pour cet événement selon les réglages, ou null s'il ne mérite pas d'en être une
 * (CA-SESS-83, CA-SESS-84). Une fin de tour qui pose une question est une question ; sinon, elle ne compte que si le
 * tour a été long, ou toujours selon le réglage. Un tour de durée inconnue (Bosco redémarré) compte comme long.
 */
export function notificationOf(event: NotificationEvent, settings: NotificationSettings): NotificationKind | null {
  if (event.kind !== 'turn') return settings[event.kind] ? event.kind : null;
  if (endsWithQuestion(event.message)) return settings.turnQuestion ? 'turn-question' : null;
  if (settings.turn === 'never') return null;
  if (settings.turn === 'always') return 'long-turn';
  return event.minutes === null || event.minutes >= settings.longTurnMinutes ? 'long-turn' : null;
}

/** Une notification gardée 7 jours dans le centre de notifications (E15a). */
export interface NotificationRecord {
  at: Date;
  excerpt: null | string;
  id: number;
  kind: NotificationKind;
  readAt: Date | null;
  sessionId: null | string;
  /** Traitée : répondue, relue, relancée ; elle sort de « À traiter » */
  settled: null | string;
  taskId: null | number;
  /** Session ou tâche concernée (« T-12 · Ajouter la prononciation de « SNCF » au lexique ») */
  title: string;
  /** Durée du tour, pour une fin de long tour */
  turnMinutes: null | number;
}

export const NOTIFICATION_RETENTION_DAYS = 7;

/** Libellé du type, en tête de la notification (E15a, E15b). */
export const KIND_LABELS: Record<NotificationKind, string> = {
  ended: 'Session terminée',
  failed: 'En échec',
  'long-turn': 'Fin de tour',
  permission: 'Autorisation',
  question: 'Question de l’agent',
  review: 'À relire',
  'turn-question': 'Question',
};
