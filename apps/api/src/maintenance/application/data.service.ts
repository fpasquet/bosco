import type { HistoryPeriod } from '../../shared/domain/history-period.ts';
import { checkResetWord } from '../domain/reset.ts';

/** Historique importé tel que les sessions le décrivent. */
export interface HistoryDescription {
  importing: boolean;
  oldestSessionAt: Date | null;
  /** Sessions plus anciennes que la période, encore dans les profils surveillés, et les profils qui les gardent */
  older: { profiles: string[]; sessions: number };
  period: HistoryPeriod;
  sessions: number;
}

/** Ce que la réinitialisation retirerait des profils et perdrait, vu des sessions. */
export interface ResetImpact {
  /** Branches de bac à sable pas encore récupérées */
  branches: string[];
  /** Profils dont le suivi en direct, le canal ou le serveur de Bosco seraient retirés */
  profiles: string[];
  sources: number;
}

/** Historique importé, sources et bacs à sable, tenus par les sessions. */
export interface DataSessions {
  chooseHistory(period: HistoryPeriod): Promise<void>;
  describeHistory(): Promise<HistoryDescription>;
  resetImpact(): Promise<ResetImpact>;
}

/** Projets et groupes choisis, tenus par les projets. */
export interface DataCatalog {
  countGroups(): Promise<number>;
  countProjects(): number;
}

/** La base de Bosco : l'effacement de tout ce qu'elle garde (les migrations restent). */
export interface DatabaseStore {
  erase(): Promise<void>;
}

/** Le dossier des données de Bosco : sa taille, base et copies des bacs à sable comprises. */
export interface DataFolder {
  readonly path: string;
  size(): Promise<number>;
}

/** Étapes de la réinitialisation, dans l'ordre, branchées par le point de composition. */
export interface ResetSteps {
  /** Tours, import de l'historique et bacs à sable arrêtés, conteneurs et copies supprimés */
  stopActivity(): Promise<void>;
  /** Suivi en direct, serveur MCP et canal retirés de chaque profil, réglages d'avant remis */
  cleanProfiles(): Promise<void>;
  /** Lecture des profils arrêtée et états gardés en mémoire oubliés */
  forgetState(): Promise<void>;
  /** Ce que chaque contexte garde en mémoire, relu depuis la base vide */
  reload(): Promise<void>;
}

export interface DataView {
  database: { bytes: number; dataDir: string };
  history: HistoryDescription;
  reset: ResetImpact & { groups: number; projects: number; sessions: number };
}

const NO_SESSIONS: DataSessions = {
  chooseHistory: () => Promise.resolve(),
  describeHistory: () =>
    Promise.resolve({
      importing: false,
      older: { profiles: [], sessions: 0 },
      oldestSessionAt: null,
      period: '30-days',
      sessions: 0,
    }),
  resetImpact: () => Promise.resolve({ branches: [], profiles: [], sources: 0 }),
};

const NO_CATALOG: DataCatalog = { countGroups: () => Promise.resolve(0), countProjects: () => 0 };

const NO_STEPS: ResetSteps = {
  stopActivity: () => Promise.resolve(),
  cleanProfiles: () => Promise.resolve(),
  forgetState: () => Promise.resolve(),
  reload: () => Promise.resolve(),
};

/**
 * Données de Bosco : l'historique importé, la base, et la réinitialisation, qui ramène Bosco au premier lancement
 * sans redémarrer. Rien n'est jamais effacé dans les dossiers de Claude Code.
 */
export class DataService {
  private sessions = NO_SESSIONS;
  private catalog = NO_CATALOG;
  private steps = NO_STEPS;
  private resetting: null | Promise<void> = null;

  constructor(
    private readonly database: DatabaseStore,
    private readonly folder: DataFolder,
  ) {}

  useSessions(sessions: DataSessions): void {
    this.sessions = sessions;
  }

  useCatalog(catalog: DataCatalog): void {
    this.catalog = catalog;
  }

  useReset(steps: ResetSteps): void {
    this.steps = steps;
  }

  async describeData(): Promise<DataView> {
    const [history, bytes, impact, groups] = await Promise.all([
      this.sessions.describeHistory(),
      this.folder.size(),
      this.sessions.resetImpact(),
      this.catalog.countGroups(),
    ]);
    return {
      database: { bytes, dataDir: this.folder.path },
      history,
      reset: { ...impact, groups, projects: this.catalog.countProjects(), sessions: history.sessions },
    };
  }

  /** Période de l'historique : tout l'historique lit les transcripts plus anciens en arrière-plan. */
  async chooseHistory(period: HistoryPeriod): Promise<DataView> {
    await this.sessions.chooseHistory(period);
    return this.describeData();
  }

  /** « Tout effacer » : seulement sur le mot de confirmation ; une seconde demande attend la première. */
  async resetAll(word: string): Promise<void> {
    checkResetWord(word);
    this.resetting ??= this.runSteps().finally(() => {
      this.resetting = null;
    });
    await this.resetting;
  }

  private async runSteps(): Promise<void> {
    await this.steps.stopActivity();
    await this.steps.cleanProfiles();
    await this.steps.forgetState();
    await this.database.erase();
    await this.steps.reload();
  }
}
