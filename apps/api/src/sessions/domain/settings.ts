import { DomainError } from '../../shared/domain/domain-error.ts';

/** Réglages de Bosco (E4a) : seuil d'inactivité et notification du bureau. */
export interface SettingsSnapshot {
  /** Notification du bureau à chaque nouvelle attente, activée par défaut (RF-SESS-08, CA-SESS-61) */
  desktopNotifications: boolean;
  /** Délai sans événement après lequel une session passe Inactive : 15 min par défaut, de 5 à 60 (CA-SESS-59) */
  inactivityMinutes: number;
}

export const DEFAULT_SETTINGS: SettingsSnapshot = { desktopNotifications: true, inactivityMinutes: 15 };

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

  static restore(snapshot: null | SettingsSnapshot): Settings {
    return new Settings({ ...DEFAULT_SETTINGS, ...snapshot });
  }

  update(changes: Partial<SettingsSnapshot>): void {
    const next = { ...this.snapshot, ...changes };
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
    return { ...this.snapshot };
  }
}
