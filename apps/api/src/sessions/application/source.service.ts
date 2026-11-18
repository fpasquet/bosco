import type { ProfileCandidate } from '../domain/profile-candidate.ts';
import type {
  Clock,
  IdGenerator,
  ProfileFinder,
  SessionRegistry,
  SourceRepository,
  TranscriptWatcher,
} from './ports.ts';
import type { SessionService } from './session.service.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import { Source, type SourceSnapshot } from '../domain/source.ts';

export class NotAProfile extends DomainError {
  constructor(path: string) {
    super('notAProfile', `${path} is not a Claude Code configuration folder`);
  }
}

export class SourceAlreadyKnown extends DomainError {
  constructor(path: string) {
    super('sourceAlreadyKnown', `${path} is already a source`);
  }
}

/** Profils lus au premier lancement : les 30 derniers jours (CA-SESS-03). */
export const HISTORY_DAYS = 30;

export interface SourcesView {
  /** Dossiers trouvés sur le poste, proposés tant qu'aucun profil n'est choisi (premier lancement) */
  candidates: ProfileCandidate[];
  sources: SourceSnapshot[];
}

export class SourceService {
  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly profileFinder: ProfileFinder,
    private readonly transcriptWatcher: TranscriptWatcher,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
    private readonly registry?: { service: Pick<SessionService, 'refreshSessions'>; sessions: SessionRegistry },
  ) {}

  /** Profils déjà choisis, ou, au premier lancement, les dossiers trouvés et leur aperçu, sans rien lire d'autre. */
  async listSources(): Promise<SourcesView> {
    const sources = await this.sourceRepository.list();
    const candidates = sources.length === 0 ? await this.profileFinder.findCandidates() : [];
    return { sources: sources.map((source) => source.toSnapshot()), candidates };
  }

  /** Premier lancement : retient les profils cochés, garde les autres de côté, puis lit les premiers. */
  async watchProfiles(paths: string[]): Promise<SourceSnapshot[]> {
    const candidates = await this.profileFinder.findCandidates();
    const sources = candidates.map((candidate) =>
      Source.choose(this.idGenerator.next(), candidate.path, paths.includes(candidate.path)),
    );
    await this.sourceRepository.save(sources);
    await this.resumeWatching(sources);
    return sources.map((source) => source.toSnapshot());
  }

  /** « Ajouter un dossier » : un autre dossier de configuration de Claude Code, surveillé comme un profil. */
  async addSource(path: string): Promise<SourceSnapshot> {
    const sources = await this.sourceRepository.list();
    if (sources.some((source) => source.path === path)) throw new SourceAlreadyKnown(path);
    const candidate = await this.profileFinder.inspect(path);
    if (!candidate) throw new NotAProfile(path);
    const source = Source.choose(this.idGenerator.next(), candidate.path, true);
    await this.sourceRepository.save([source]);
    await this.resumeWatching([source]);
    return source.toSnapshot();
  }

  /** Interrupteur d'une source (E4a) : la lecture s'arrête, ou reprend là où elle en était (CA-SESS-56). */
  async setWatched(sourceId: string, watched: boolean): Promise<null | SourceSnapshot> {
    const sources = await this.sourceRepository.list();
    const source = sources.find((candidate) => candidate.id === sourceId);
    if (!source) return null;
    source.setWatched(watched);
    await this.sourceRepository.save([source]);
    if (watched) await this.resumeWatching([source]);
    else {
      await this.transcriptWatcher.unwatch(source.id);
      this.registry?.sessions.unwatch(source.id);
    }
    return source.toSnapshot();
  }

  /**
   * Profil des bacs à sable, tenu par Bosco : ajouté au premier bac à sable, toujours lu. Un profil déjà connu comme
   * source ordinaire (avant que Bosco le tienne à part) est repris sans changer d'identifiant.
   */
  async ensureSource(path: string): Promise<SourceSnapshot> {
    const known = await this.keepManaged(path);
    if (known) return known;
    const source = Source.manage(this.idGenerator.next(), path);
    await this.sourceRepository.save([source]);
    await this.resumeWatching([source]);
    return source.toSnapshot();
  }

  /** Au démarrage : reprend à part le profil des bacs à sable s'il est déjà connu, sans le créer. */
  async keepManaged(path: string): Promise<null | SourceSnapshot> {
    const sources = await this.sourceRepository.list();
    const known = sources.find((source) => source.path === path);
    if (!known) return null;
    if (known.managed) return known.toSnapshot();
    const wasWatched = known.watched;
    known.takeOver();
    await this.sourceRepository.save([known]);
    if (!wasWatched) await this.resumeWatching([known]);
    return known.toSnapshot();
  }

  /** Au démarrage du service : reprend la lecture des profils surveillés là où elle s'était arrêtée. */
  async resumeWatching(sources?: Source[]): Promise<void> {
    const watched = (sources ?? (await this.sourceRepository.list())).filter((source) => source.watched);
    const since = new Date(this.clock.now().getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
    for (const source of watched) {
      // Le registre d'abord : les sessions lues ensuite ont déjà leur état ouvert ou terminé
      const registry = this.registry;
      if (registry) await registry.sessions.watch(source, (ids) => void registry.service.refreshSessions(ids));
      await this.transcriptWatcher.watch(source, since);
    }
  }
}
