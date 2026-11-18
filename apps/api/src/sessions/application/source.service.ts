import type { ProfileCandidate } from '../domain/profile-candidate.ts';
import type {
  Clock,
  HistoryPeriodStore,
  IdGenerator,
  ProfileFinder,
  SessionRegistry,
  SourceRecords,
  SourceRepository,
  TranscriptWatcher,
} from './ports.ts';
import type { SessionService } from './session.service.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import { type HistoryPeriod, historyStart } from '../../shared/domain/history-period.ts';
import { Source, type SourceSnapshot } from '../domain/source.ts';

export class NotAProfile extends DomainError {
  constructor(path: string) {
    super('notAProfile', `${path} is not a Claude Code configuration folder`);
  }
}

/** Fichier refusé comme jeton longue durée : son message s'affiche tel quel. */
export class InvalidTokenFile extends DomainError {
  constructor(message: string) {
    super('invalidTokenFile', message);
  }
}

export class SourceAlreadyKnown extends DomainError {
  constructor(path: string) {
    super('sourceAlreadyKnown', `${path} is already a source`);
  }
}

export interface SourcesView {
  /** Dossiers trouvés sur le poste, proposés tant qu'aucun profil n'est choisi (premier lancement) */
  candidates: ProfileCandidate[];
  sources: (SourceSnapshot & {
    /** Format des nouvelles sessions illisible : la source est « À mettre à jour », ses nouvelles sessions ne se lisent plus */
    unreadable: boolean;
  })[];
}

export interface HistoryView {
  importing: boolean;
  /** Sessions plus anciennes que la période, encore dans les profils surveillés, et les profils qui les gardent */
  older: { profiles: string[]; sessions: number };
  oldestSessionAt: Date | null;
  period: HistoryPeriod;
  sessions: number;
}

export class SourceService {
  /** Lecture en cours des transcripts plus anciens, après le passage à tout l'historique */
  private importing: null | Promise<void> = null;
  private generation = 0;

  constructor(
    private readonly sourceRepository: SourceRepository,
    private readonly profileFinder: ProfileFinder,
    private readonly transcriptWatcher: TranscriptWatcher,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
    private readonly history: HistoryPeriodStore,
    private readonly records: Pick<SourceRecords, 'countSessions'>,
    private readonly registry?: { service: Pick<SessionService, 'refreshSessions'>; sessions: SessionRegistry },
  ) {}

  /** Profils déjà choisis, ou, au premier lancement, les dossiers trouvés et leur aperçu, sans rien lire d'autre. */
  async listSources(): Promise<SourcesView> {
    const sources = await this.sourceRepository.list();
    // Sans profil choisi, la dernière source retirée comprise, Bosco propose de nouveau les profils du poste ; la source
    // des bacs à sable, tenue par Bosco, ne compte pas
    const chosen = sources.some(({ managed }) => !managed);
    const candidates = chosen ? [] : await this.profileFinder.findCandidates();
    return {
      sources: sources.map((source) => ({
        ...source.toSnapshot(),
        unreadable: this.transcriptWatcher.isOutdated(source.id),
      })),
      candidates,
    };
  }

  /**
   * Premier lancement : retient les profils cochés, garde les autres de côté, puis lit les premiers, sur la période
   * choisie (les 30 derniers jours, ou tout l'historique).
   */
  async watchProfiles(paths: string[], period?: HistoryPeriod): Promise<SourceSnapshot[]> {
    if (period) await this.history.save(period);
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

  /** Interrupteur d'une source : la lecture s'arrête, ou reprend là où elle en était. */
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
   * « Utiliser un jeton longue durée » : le fichier où la personne a rangé le jeton de `claude setup-token`, vérifié
   * lisible et non vide ; Bosco n'en garde que le chemin. null : « Retirer », le profil revient à sa connexion.
   */
  async declareToken(sourceId: string, file: null | string): Promise<null | SourceSnapshot> {
    const sources = await this.sourceRepository.list();
    const source = sources.find((candidate) => candidate.id === sourceId);
    if (!source) return null;
    if (file) {
      const problem = await this.profileFinder.tokenFileProblem(file);
      if (problem) throw new InvalidTokenFile(problem);
    }
    source.declareToken(file);
    await this.sourceRepository.save([source]);
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

  /**
   * Historique importé : sa période, les sessions gardées et la plus ancienne, et la lecture des transcripts plus
   * anciens quand elle est en cours.
   */
  async describeHistory(): Promise<HistoryView> {
    const period = await this.history.load();
    const { count, oldestAt } = await this.records.countSessions();
    const older = { profiles: [] as string[], sessions: 0 };
    if (period !== 'all') {
      const since = historyStart(period, this.clock.now());
      const sources = await this.sourceRepository.list();
      for (const source of sources.filter(({ managed, watched }) => watched && !managed)) {
        const unread = await this.transcriptWatcher.countUnread(source, since);
        if (unread === 0) continue;
        older.sessions += unread;
        older.profiles.push(source.label);
      }
    }
    return { importing: this.importing !== null, older, oldestSessionAt: oldestAt, period, sessions: count };
  }

  /**
   * Période de l'historique : passer à tout l'historique lit en arrière-plan les transcripts plus anciens des profils
   * surveillés, sans relire ceux déjà lus ; revenir aux 30 derniers jours n'efface rien.
   */
  async chooseHistory(period: HistoryPeriod): Promise<void> {
    await this.history.save(period);
    if (period !== 'all' || this.importing) return;
    const sources = await this.sourceRepository.list();
    const since = historyStart(period, this.clock.now());
    const generation = this.generation;
    const importing = (async () => {
      for (const source of sources.filter(({ watched }) => watched)) {
        // Une remise à zéro arrête l'import entre deux profils
        if (generation !== this.generation) return;
        await this.transcriptWatcher.readSince(source, since);
      }
    })();
    this.importing = importing
      .catch((error: unknown) => {
        console.warn(`history import stopped: ${error instanceof Error ? error.message : String(error)}`);
      })
      .finally(() => {
        this.importing = null;
      });
  }

  /** Remise à zéro : l'import de l'historique s'arrête après le profil en cours de lecture. */
  async stopImport(): Promise<void> {
    this.generation += 1;
    await this.importing;
  }

  /** Réinitialisation : l'import s'arrête et plus aucun profil n'est lu ; rien n'est effacé ici. */
  async stopWatching(): Promise<void> {
    await this.stopImport();
    const sources = await this.sourceRepository.list();
    for (const source of sources) {
      await this.transcriptWatcher.unwatch(source.id);
      this.registry?.sessions.unwatch(source.id);
    }
  }

  /** Au démarrage du service : reprend la lecture des profils surveillés là où elle s'était arrêtée. */
  async resumeWatching(sources?: Source[]): Promise<void> {
    const watched = (sources ?? (await this.sourceRepository.list())).filter((source) => source.watched);
    const period = await this.history.load();
    const since = historyStart(period, this.clock.now());
    for (const source of watched) {
      // Le registre d'abord : les sessions lues ensuite ont déjà leur état ouvert ou terminé
      const registry = this.registry;
      if (registry) await registry.sessions.watch(source, (ids) => void registry.service.refreshSessions(ids));
      await this.transcriptWatcher.watch(source, since);
    }
  }
}
