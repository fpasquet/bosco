import type { DiscoverySnapshot } from '../domain/repository-discovery.ts';
import type { SettingsRepository } from './ports.ts';
import { Settings, type SettingsChanges, type SettingsSnapshot } from '../domain/settings.ts';

/** Cas d'usage des réglages ; gardés en mémoire, car l'état de chaque session en dépend (seuil d'inactivité). */
export class SettingsService {
  private settings = Settings.restore(null);

  constructor(private readonly repository: SettingsRepository) {}

  async load(): Promise<void> {
    const stored = await this.repository.load();
    this.settings = Settings.restore(stored);
  }

  current(): SettingsSnapshot {
    return this.settings.toSnapshot();
  }

  inactivityDelayMs(): number {
    return this.settings.inactivityDelayMs;
  }

  desktopNotifications(): boolean {
    return this.settings.desktopNotifications;
  }

  repositories(): DiscoverySnapshot {
    return this.settings.repositories;
  }

  async update(changes: SettingsChanges): Promise<SettingsSnapshot> {
    const next = Settings.restore(this.settings.toSnapshot());
    next.update(changes);
    await this.repository.save(next.toSnapshot());
    this.settings = next;
    return next.toSnapshot();
  }
}
