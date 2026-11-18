import type { HookEndpoint, ProfileSettings, SourceRepository } from './ports.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import { ManagedSource, type Source } from '../domain/source.ts';

/** Les six événements que suit Bosco : démarrage et fin, message, action, autorisation, fin de tour (E4b). */
export const LIVE_TRACKING_EVENTS = [
  'SessionStart',
  'SessionEnd',
  'UserPromptSubmit',
  'PostToolUse',
  'PermissionRequest',
  'Stop',
] as const;

export interface LiveTrackingStatus {
  installed: boolean;
  /** Installé par une autre version de Bosco : ses hooks ne sont plus ceux d'aujourd'hui, à réinstaller */
  outdated: boolean;
  /** Dernier signal reçu d'une session de ce profil : la vérification repose sur un vrai signal (CA-SESS-64) */
  lastSignalAt: Date | null;
  settingsPath: string;
}

export class UnknownSource extends DomainError {
  constructor(sourceId: string) {
    super('unknownSource', `No source ${sourceId}`);
  }
}

/** Cas d'usage de l'installation du suivi en direct, profil par profil, défaite en un clic (E4b). */
export class LiveTrackingService {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly settings: ProfileSettings,
    /** Adresse de l'entrée des hooks pour un profil, fixée par le point de composition (port, secret) */
    private readonly endpointOf: (sourceId: string) => HookEndpoint,
    private readonly lastSignalAt: (sourceId: string) => Date | null,
  ) {}

  async status(sourceId: string): Promise<LiveTrackingStatus> {
    const source = await this.sourceOf(sourceId);
    const installation = await this.settings.installation(source.path, this.endpointOf(source.id));
    return {
      installed: installation === 'installed',
      outdated: installation === 'outdated',
      lastSignalAt: this.lastSignalAt(source.id),
      settingsPath: `${source.path}/settings.json`,
    };
  }

  async install(sourceId: string, backup: boolean): Promise<LiveTrackingStatus & { backupPath: null | string }> {
    const source = await this.sourceOf(sourceId);
    // Bosco lance lui-même les sessions des bacs à sable : rien à écrire dans leur profil
    if (source.managed) throw new ManagedSource(source.path);
    const { backupPath } = await this.settings.install(source.path, this.endpointOf(source.id), backup);
    await this.setLiveTracking(source, true);
    const status = await this.status(sourceId);
    return { ...status, backupPath };
  }

  async uninstall(sourceId: string): Promise<LiveTrackingStatus> {
    const source = await this.sourceOf(sourceId);
    await this.settings.uninstall(source.path, this.endpointOf(source.id));
    await this.setLiveTracking(source, false);
    return this.status(sourceId);
  }

  private async setLiveTracking(source: Source, enabled: boolean): Promise<void> {
    const sources = await this.sourceRepository.list();
    for (const candidate of sources) {
      if (candidate.id !== source.id) continue;
      if (enabled) candidate.enableLiveTracking();
      else candidate.disableLiveTracking();
    }
    await this.sourceRepository.save(sources);
  }

  private async sourceOf(sourceId: string): Promise<Source> {
    const sources = await this.sourceRepository.list();
    const source = sources.find((candidate) => candidate.id === sourceId);
    if (!source) throw new UnknownSource(sourceId);
    return source;
  }
}
