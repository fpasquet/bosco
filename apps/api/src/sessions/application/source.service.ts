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
import { Source, type SourceSnapshot } from '../domain/source.ts';

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
