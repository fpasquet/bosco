import { DomainError } from '../../shared/domain/domain-error.ts';
import {
  checkNotificationSettings,
  DEFAULT_NOTIFICATIONS,
  InvalidNotificationSettings,
  type NotificationSettings,
} from './notification.ts';

/** Réglages de Bosco : seuil d'inactivité et notification du bureau. */
export interface SettingsSnapshot {
  /** Notification du bureau à chaque nouvelle attente, activée par défaut */
  desktopNotifications: boolean;
  /** Délai sans événement après lequel une session passe Inactive : 15 min par défaut, de 5 à 60 */
  inactivityMinutes: number;
  /** Ce qui mérite une notification, type par type */
  notifications: NotificationSettings;
}

/** Changement de réglages : les réglages des notifications se changent un par un. */
export type SettingsChanges = Partial<Omit<SettingsSnapshot, 'notifications'>> & {
  notifications?: Partial<NotificationSettings>;
};

export const DEFAULT_SETTINGS: SettingsSnapshot = {
  desktopNotifications: true,
  inactivityMinutes: 15,
  notifications: DEFAULT_NOTIFICATIONS,
};

export const INACTIVITY_MINUTES = { max: 60, min: 5 } as const;

export class InvalidSetting extends DomainError {
  constructor(message: string) {
    super('invalidSetting', message);
  }
}

export class Settings {
  private constructor(private snapshot: SettingsSnapshot) {}

  get inactivityDelayMs(): number {
    return this.snapshot.inactivityMinutes * 60 * 1000;
  }

  get desktopNotifications(): boolean {
    return this.snapshot.desktopNotifications;
  }

  get notifications(): NotificationSettings {
    return this.snapshot.notifications;
  }

  static restore(snapshot: null | SettingsChanges): Settings {
    return new Settings({
      ...DEFAULT_SETTINGS,
      ...snapshot,
      notifications: { ...DEFAULT_NOTIFICATIONS, ...snapshot?.notifications },
    });
  }

  update(changes: SettingsChanges): void {
    const notifications = { ...this.snapshot.notifications, ...changes.notifications };
    try {
      checkNotificationSettings(notifications);
    } catch (error) {
      if (error instanceof InvalidNotificationSettings) throw new InvalidSetting(error.message);
      throw error;
    }
    const next = { ...this.snapshot, ...changes, notifications };
    const { inactivityMinutes } = next;
    if (
      !Number.isInteger(inactivityMinutes) ||
      inactivityMinutes < INACTIVITY_MINUTES.min ||
      inactivityMinutes > INACTIVITY_MINUTES.max
    )
      throw new InvalidSetting(
        `The inactivity threshold must be ${INACTIVITY_MINUTES.min} to ${INACTIVITY_MINUTES.max} minutes`,
      );
    this.snapshot = next;
  }

  toSnapshot(): SettingsSnapshot {
    return {
      ...this.snapshot,
      notifications: { ...this.snapshot.notifications },
    };
  }
}
