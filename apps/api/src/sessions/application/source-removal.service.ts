import type { ChannelInstaller } from './channel.service.ts';
import type { LiveSignalService } from './live-signal.service.ts';
import type { LiveTrackingService } from './live-tracking.service.ts';
import type { PilotService } from './pilot.service.ts';
import type { SessionRegistry, SourceRecords, SourceRepository, TranscriptWatcher } from './ports.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import { ManagedSource, type Source } from '../domain/source.ts';
import { UnknownSource } from './live-tracking.service.ts';

/** Un tour d'une session du profil tourne encore : le retrait attend qu'il finisse. */
export class SourceBusy extends DomainError {
  constructor(path: string) {
    super('sourceBusy', `A turn of a session of ${path} is running`);
  }
}

/** Ce qui, dans les autres contextes, prend ce profil par défaut : groupes, projets, abonnement par défaut. */
export interface ProfileReferences {
  /**
   * Les groupes et projets dont c'est le profil par défaut, s'il est l'abonnement par défaut de Bosco, et le nom de
   * l'abonnement par défaut après le retrait (le profil surveillé suivant s'il l'était) ; null sans abonnement
   */
  using(path: string): Promise<ProfileUse>;
  /** Ils reprennent l'abonnement par défaut ; s'il l'était, le profil surveillé suivant le devient */
  release(path: string): Promise<void>;
}

export interface ProfileUse {
  defaultSubscription: boolean;
  groups: string[];
  projects: string[];
  subscription: null | string;
}

const NO_REFERENCES: ProfileReferences = {
  using: () => Promise.resolve({ defaultSubscription: false, groups: [], projects: [], subscription: null }),
  release: () => Promise.resolve(),
};

/** Ce que retirer une source changerait, pour la fenêtre de confirmation. */
export interface SourceRemoval {
  channel: boolean;
  defaultSubscription: boolean;
  groups: string[];
  label: string;
  liveTracking: boolean;
  path: string;
  projects: string[];
  /** Sessions du profil dont un tour tourne : le retrait attend qu'ils finissent */
  running: number;
  sessions: number;
  /** Abonnement par défaut après le retrait ; null sans abonnement */
  subscription: null | string;
}

/**
 * Retrait d'une source : Bosco désinstalle ce qu'il a ajouté au profil (suivi en direct, serveur MCP, canal), puis
 * oublie la source et ses sessions. Le dossier du profil et ses transcripts ne sont jamais touchés : le profil peut
 * revenir par « Ajouter un dossier ».
 */
export class SourceRemovalService {
  private references = NO_REFERENCES;

  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly records: SourceRecords,
    private readonly watcher: Pick<TranscriptWatcher, 'forget'>,
    private readonly registry: Pick<SessionRegistry, 'unwatch'>,
    private readonly liveTracking: Pick<LiveTrackingService, 'status' | 'uninstall'>,
    private readonly channel: Pick<ChannelInstaller, 'isInstalled' | 'uninstall'>,
    private readonly pilot: Pick<PilotService, 'load' | 'replaceProfile' | 'runningTurns'>,
    private readonly liveSignals: Pick<LiveSignalService, 'forgetSessions'>,
  ) {}

  /** Groupes, projets et abonnement par défaut, branchés par le point de composition. */
  useReferences(references: ProfileReferences): void {
    this.references = references;
  }

  async previewRemoval(sourceId: string): Promise<SourceRemoval> {
    const source = await this.removable(sourceId);
    const [{ count }, status, channel, references, running] = await Promise.all([
      this.records.countSessions(source.id),
      this.liveTracking.status(source.id),
      this.channel.isInstalled(source.path).catch(() => false),
      this.references.using(source.path),
      this.runningIn(source),
    ]);
    return {
      channel,
      defaultSubscription: references.defaultSubscription,
      groups: references.groups,
      label: source.label,
      liveTracking: status.installed || status.outdated || status.mcpServer,
      path: source.path,
      projects: references.projects,
      running,
      sessions: count,
      subscription: references.subscription,
    };
  }

  async removeSource(sourceId: string): Promise<void> {
    const source = await this.removable(sourceId);
    const running = await this.runningIn(source);
    if (running > 0) throw new SourceBusy(source.path);
    // D'abord ce que Bosco a écrit dans le profil, tant que la source le connaît
    await this.cleanProfile(source);
    await this.watcher.forget(source);
    this.registry.unwatch(source.id);
    const sessionIds = await this.records.sessionIds(source.id);
    this.liveSignals.forgetSessions(sessionIds);
    await this.references.release(source.path);
    await this.pilot.replaceProfile(source.path);
    await this.records.forget({ id: source.id, path: source.path });
    // Les sessions pilotées de la source sont oubliées avec elle
    await this.pilot.load();
  }

  /** Profils où Bosco a installé quelque chose (suivi en direct, serveur MCP, canal), que la réinitialisation nettoie. */
  async listInstalledProfiles(): Promise<string[]> {
    const sources = await this.sourceRepository.list();
    const labels: string[] = [];
    for (const source of sources.filter(({ managed }) => !managed))
      if (await this.hasInstallation(source)) labels.push(source.label);
    return labels;
  }

  /**
   * Réinitialisation : ce que Bosco a installé est retiré de chaque profil, réglages d'avant remis. Un profil dont les
   * réglages sont illisibles est laissé tel quel, sans arrêter les autres.
   */
  async cleanProfiles(): Promise<void> {
    const sources = await this.sourceRepository.list();
    for (const source of sources.filter(({ managed }) => !managed))
      await this.cleanProfile(source).catch((error: unknown) => {
        console.warn(`profile ${source.path} left as is: ${error instanceof Error ? error.message : String(error)}`);
      });
  }

  private async hasInstallation(source: Source): Promise<boolean> {
    const status = await this.liveTracking.status(source.id).catch(() => null);
    if (status && (status.installed || status.outdated || status.mcpServer)) return true;
    return this.channel.isInstalled(source.path).catch(() => false);
  }

  /** Suivi en direct, serveur MCP et canal retirés du profil, seulement s'ils y sont : rien d'autre n'est réécrit. */
  private async cleanProfile(source: Source): Promise<void> {
    const status = await this.liveTracking.status(source.id);
    if (status.installed || status.outdated || status.mcpServer) await this.liveTracking.uninstall(source.id);
    const channel = await this.channel.isInstalled(source.path).catch(() => false);
    if (channel) await this.channel.uninstall(source.path);
  }

  /** Une source ordinaire ; la source des bacs à sable est tenue par Bosco. */
  private async removable(sourceId: string): Promise<Source> {
    const sources = await this.sourceRepository.list();
    const source = sources.find(({ id }) => id === sourceId);
    if (!source) throw new UnknownSource(sourceId);
    if (source.managed) throw new ManagedSource(source.path);
    return source;
  }

  private async runningIn(source: Source): Promise<number> {
    const running = new Set(this.pilot.runningTurns().map(({ sessionId }) => sessionId));
    if (running.size === 0) return 0;
    const sessionIds = await this.records.sessionIds(source.id);
    return sessionIds.filter((id) => running.has(id)).length;
  }
}
