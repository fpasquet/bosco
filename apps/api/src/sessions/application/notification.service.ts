import type { Clock } from './ports.ts';
import type { SettingsService } from './settings.service.ts';
import {
  ASKING,
  NOTIFICATION_RETENTION_DAYS,
  type NotificationEvent,
  type NotificationKind,
  notificationOf,
  type NotificationRecord,
} from '../domain/notification.ts';

/** Ce que la notification désigne : une session ou une tâche, son titre, et un extrait. */
export interface NotificationSubject {
  excerpt: null | string;
  /** Dépôt de la session ou de la tâche */
  place: null | string;
  sessionId: null | string;
  taskId: null | number;
  title: string;
  turnMinutes?: null | number;
}

export interface NotificationRepository {
  add(notification: Omit<NotificationRecord, 'id'>): Promise<NotificationRecord>;
  /** Les plus récentes d'abord, depuis cette date */
  list(since: Date): Promise<NotificationRecord[]>;
  markRead(ids: null | number[], at: Date): Promise<void>;
  purge(before: Date): Promise<void>;
  /** Marque traitées les notifications encore à traiter de cette session ou de cette tâche */
  settle(
    match: { kinds: readonly NotificationKind[]; sessionId?: string; taskId?: number },
    note: string,
  ): Promise<number>;
}

/** Notification du bureau (E15b) : une par session ou tâche, remplacée par la suivante ; un clic ouvre l'adresse. */
export interface DesktopAlerts {
  show(notification: NotificationRecord, options: { url: string; urgent: boolean }): void;
}

/** L'onglet Bosco est-il au premier plan sur le poste ? */
export interface Presence {
  /** L'application du poste est là : elle montre les notifications en natif, le service ne les envoie pas (E17a) */
  appAttached(): boolean;
  foreground(): boolean;
}

/** Ce que l'interface reçoit en direct : une nouvelle notification (et si elle s'y montre en message bref). */
export interface NotificationEvents {
  changed(): void;
  notified(notification: NotificationRecord, inApp: boolean): void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Notifications (E15, règle 8) : ce qui arrive est jugé selon les réglages, gardé dans le centre de notifications,
 * puis montré par une notification du bureau, ou par un message bref quand l'onglet Bosco est au premier plan.
 */
export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository,
    private readonly settings: Pick<SettingsService, 'desktopNotifications' | 'notifications'>,
    private readonly desktop: DesktopAlerts,
    private readonly presence: Presence,
    private readonly events: NotificationEvents,
    private readonly clock: Clock,
    /** Adresse de Bosco sur le poste, pour qu'un clic sur la notification ouvre la session ou la tâche */
    private readonly baseUrl: string,
  ) {}

  /** Un événement arrive : null s'il ne mérite pas de notification selon les réglages (CA-SESS-83, CA-SESS-84). */
  async notify(event: NotificationEvent, subject: NotificationSubject): Promise<NotificationRecord | null> {
    const kind = notificationOf(event, this.settings.notifications());
    if (!kind) return null;
    const at = this.clock.now();
    const notification = await this.repository.add({
      at,
      excerpt: subject.excerpt,
      kind,
      place: subject.place,
      readAt: null,
      sessionId: subject.sessionId,
      settled: null,
      taskId: subject.taskId,
      title: subject.title,
      turnMinutes: subject.turnMinutes ?? null,
    });
    const inApp = this.settings.notifications().inAppWhenForeground && this.presence.foreground();
    if (this.settings.desktopNotifications() && !inApp && !this.presence.appAttached())
      this.desktop.show(notification, { url: this.urlOf(notification), urgent: ASKING.includes(kind) });
    this.events.notified(notification, inApp);
    return notification;
  }

  /** Une attente a reçu sa réponse, une tâche a été relue : ses notifications sortent de « À traiter ». */
  async settle(
    match: { kinds: readonly NotificationKind[]; sessionId?: string; taskId?: number },
    note: string,
  ): Promise<void> {
    const count = await this.repository.settle(match, note);
    if (count > 0) this.events.changed();
  }

  /** Centre de notifications (E15a) : 7 jours, les plus récentes d'abord, et le nombre de non lues. */
  async list(): Promise<{ notifications: NotificationRecord[]; unread: number }> {
    const since = new Date(this.clock.now().getTime() - NOTIFICATION_RETENTION_DAYS * DAY_MS);
    await this.repository.purge(since);
    const notifications = await this.repository.list(since);
    return { notifications, unread: notifications.filter(({ readAt }) => readAt === null).length };
  }

  /** « Tout marquer comme lu », ou une seule (ouverte) : rien n'est effacé. */
  async markRead(id: null | number): Promise<void> {
    await this.repository.markRead(id === null ? null : [id], this.clock.now());
    this.events.changed();
  }

  private urlOf(notification: NotificationRecord): string {
    if (notification.taskId !== null) return `${this.baseUrl}/tasks/${notification.taskId}`;
    return notification.sessionId ? `${this.baseUrl}/sessions/${notification.sessionId}` : this.baseUrl;
  }
}
