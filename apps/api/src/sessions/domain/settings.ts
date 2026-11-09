import { DomainError } from '../../shared/domain/domain-error.ts';
import {
  checkNotificationSettings,
  DEFAULT_NOTIFICATIONS,
  InvalidNotificationSettings,
  type NotificationSettings,
} from './notification.ts';
import { DEFAULT_DISCOVERY, type DiscoverySnapshot, folderPath, InvalidFolder } from './repository-discovery.ts';

/** Réglages de Bosco : seuil d'inactivité et notification du bureau (E4a), dépôts découverts (E4d). */
export interface SettingsSnapshot {
  /** Notification du bureau à chaque nouvelle attente, activée par défaut (RF-SESS-08, CA-SESS-61) */
  desktopNotifications: boolean;
  /** Délai sans événement après lequel une session passe Inactive : 15 min par défaut, de 5 à 60 (CA-SESS-59) */
  inactivityMinutes: number;
  /** Ce qui mérite une notification, type par type (E15b) */
  notifications: NotificationSettings;
  repositories: DiscoverySnapshot;
}

/** Changement de réglages : les réglages des dépôts se changent un par un. */
export type SettingsChanges = Partial<Omit<SettingsSnapshot, 'notifications' | 'repositories'>> & {
  notifications?: Partial<NotificationSettings>;
  repositories?: Partial<DiscoverySnapshot>;
};

export const DEFAULT_SETTINGS: SettingsSnapshot = {
  desktopNotifications: true,
  inactivityMinutes: 15,
  notifications: DEFAULT_NOTIFICATIONS,
  repositories: DEFAULT_DISCOVERY,
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

  get repositories(): DiscoverySnapshot {
    return this.snapshot.repositories;
  }

  static restore(snapshot: null | SettingsChanges): Settings {
    return new Settings({
      ...DEFAULT_SETTINGS,
      ...snapshot,
      notifications: { ...DEFAULT_NOTIFICATIONS, ...snapshot?.notifications },
      repositories: { ...DEFAULT_DISCOVERY, ...snapshot?.repositories },
    });
  }

  update(changes: SettingsChanges): void {
    const repositories = { ...this.snapshot.repositories, ...changes.repositories };
    const notifications = { ...this.snapshot.notifications, ...changes.notifications };
    try {
      checkNotificationSettings(notifications);
    } catch (error) {
      if (error instanceof InvalidNotificationSettings) throw new InvalidSetting(error.message);
      throw error;
    }
    const next = {
      ...this.snapshot,
      ...changes,
      notifications,
      repositories: {
        ...repositories,
        excluded: folders(repositories.excluded),
        hidden: [...new Set(repositories.hidden)],
        roots: folders(repositories.roots),
      },
    };
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
      repositories: { ...this.snapshot.repositories },
    };
  }
}

/** Dossiers écrits comme dans le terminal, sans doublon. */
function folders(paths: string[]): string[] {
  try {
    return [...new Set(paths.map((path) => folderPath(path)))];
  } catch (error) {
    if (error instanceof InvalidFolder) throw new InvalidSetting(error.message);
    throw error;
  }
}
