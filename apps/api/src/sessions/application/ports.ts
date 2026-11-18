import type { LevelDefaults, SessionDefaults } from '../../shared/domain/session-settings.ts';
import type { Conversation } from '../domain/conversation.ts';
import type { ProfileCandidate } from '../domain/profile-candidate.ts';
import type { Session } from '../domain/session.ts';
import type { SettingsChanges, SettingsSnapshot } from '../domain/settings.ts';
import type { Source } from '../domain/source.ts';
import type { TokenUsage } from '../domain/token-usage.ts';
import type { JournalEntry, TranscriptEvent } from '../domain/transcript-event.ts';
import type { SessionView } from './session.service.ts';

export interface SessionRepository {
  find(id: string): Promise<null | Session>;
  /** Journal d'une session, dans l'ordre (E2a) */
  journal(id: string): Promise<JournalEntry[]>;
  /** Sessions dont le titre, un message ou une commande contient chacun des mots (E3a, CA-SESS-47) */
  search(text: string): Promise<Set<string>>;
  list(): Promise<Session[]>;
  /** Enregistre la session et ajoute les nouvelles entrées de son journal, jamais modifiées ensuite. */
  save(session: Session, journal: JournalEntry[]): Promise<void>;
}

export interface SourceRepository {
  list(): Promise<Source[]>;
  save(sources: Source[]): Promise<void>;
}

/** Dossiers de configuration de Claude Code présents sur le poste, avec leur aperçu. */
export interface ProfileFinder {
  findCandidates(): Promise<ProfileCandidate[]>;
  /** Aperçu d'un dossier choisi à la main ; null s'il n'est pas un dossier de configuration de Claude Code */
  inspect(path: string): Promise<null | ProfileCandidate>;
}

/** Lit les transcripts d'un profil depuis une date, puis suit leurs ajouts, sans jamais les modifier. */
export interface TranscriptWatcher {
  /** Arrête la lecture d'un profil ; rien n'est effacé (CA-SESS-56) */
  unwatch(sourceId: string): Promise<void>;
  watch(source: Source, since: Date): Promise<void>;
}

export interface SettingsRepository {
  load(): Promise<null | SettingsChanges>;
  save(settings: SettingsSnapshot): Promise<void>;
}

/**
 * Sessions ouvertes d'un profil, d'après le registre que Claude Code tient dans le dossier du profil. Une session qui
 * en sort est terminée ; `changed` reçoit les sessions entrées ou sorties.
 */
export interface SessionRegistry {
  /** null : le profil ne tient pas de registre, l'état se déduit alors de l'activité seule */
  isOpen(sourceId: string, sessionId: string): boolean | null;
  unwatch(sourceId: string): void;
  watch(source: Source, changed: (sessionIds: string[]) => void): Promise<void>;
}

/** Publie chaque changement d'une session vers le flux en direct (DT-06) ; le domaine ne connaît pas le transport. */
export interface SessionEvents {
  /** Une autorisation a reçu sa réponse : ici, ou dans le terminal (« elsewhere »), pour un message bref (CA-SESS-07) */
  permissionSettled(settled: PermissionSettled): void;
  sessionChanged(session: SessionView): void;
}

export interface PermissionSettled {
  outcome: 'allowed' | 'denied' | 'elsewhere';
  sessionId: string;
  title: null | string;
}

/** Adresse et secret de l'entrée des hooks de Bosco pour un profil, écrits dans ses réglages. */
export interface HookEndpoint {
  secret: string;
  url: string;
}

export type LiveTrackingInstallation = 'installed' | 'missing' | 'outdated';

/** Réglages d'un profil Claude Code (<profil>/settings.json) : Bosco y ajoute ses hooks sans rien remplacer. */
export interface ProfileSettings {
  /** Hooks de Bosco ajoutés aux réglages ; `backup` garde d'abord une copie des réglages actuels (CA-SESS-62) */
  install(profilePath: string, endpoint: HookEndpoint, backup: boolean): Promise<{ backupPath: null | string }>;
  /**
   * installed : les hooks de cette version de Bosco, sur son adresse et avec son secret ; outdated : des hooks de ce
   * Bosco qui ne sont plus ceux-là (port, secret ou événements changés) ; missing : aucun
   */
  installation(profilePath: string, endpoint: HookEndpoint): Promise<LiveTrackingInstallation>;
  /** Retire les seuls hooks de Bosco : les réglages redeviennent ceux d'avant l'installation (CA-SESS-63) */
  uninstall(profilePath: string, endpoint: HookEndpoint): Promise<void>;
}

/**
 * Valeurs par défaut des sessions lancées dans Bosco avec un profil (E4g), gardées par Bosco ; NO_DEFAULTS sans
 * réglage.
 */
export interface ProfileDefaultsRepository {
  find(sourceId: string): Promise<SessionDefaults>;
  save(sourceId: string, defaults: SessionDefaults): Promise<void>;
}

/** Ce que dit un profil Claude Code de ses sessions (settings.json : mode, modèle, effort), lu sans être modifié. */
export interface ClaudeProfileDefaults {
  sessionDefaults(profilePath: string): Promise<SessionDefaults>;
}

/** Groupe de projets avec lequel démarrer une session : ses projets dans l'ordre, le principal d'abord. */
export interface CatalogGroup {
  defaults: LevelDefaults;
  id: number;
  name: string;
  projects: number[];
}

/** Projet où démarrer une session, avec ce que propose le formulaire par défaut. */
export interface CatalogProject {
  /** Valeurs par défaut de ses nouvelles sessions (E21a) */
  defaults: LevelDefaults;
  /** Domaines propres au projet, ajoutés à la liste générale pour ses bacs à sable */
  domains: string[];
  git: boolean;
  id: number;
  name: string;
  /** Dernier « Où elle tourne » choisi pour le projet ; null avant le premier */
  place: 'sandbox' | 'workstation' | null;
  root: string;
  /** Branche de départ d'un bac à sable réglée pour le projet ; null : la branche courante */
  startBranch: null | string;
}

export interface ProjectCatalog {
  /** Groupes de projets, sans « Tous les projets » */
  groups(): Promise<CatalogGroup[]>;
  list(): CatalogProject[];
  /** Note le dernier « Où elle tourne » d'une session démarrée dans le projet : la suivante le reprend */
  rememberPlace(root: string, place: 'sandbox' | 'workstation'): Promise<void>;
  /** Projet qui contient le dossier de travail d'une session (sa racine git notée à la lecture) ; null hors projet */
  placeOf(
    gitRoot: null | string,
    path: null | string,
  ): null | { folder: string; id: number; name: string; root: string };
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

/** Conversation complète d'une session, lue dans son transcript ; null quand le fichier n'existe plus. */
export interface ConversationReader {
  read(profile: string, sessionId: string): Promise<Conversation | null>;
}

/** Usage d'un tour enregistré : la session, le modèle qui a répondu et ses tokens. */
export interface RecordedTurn {
  at: Date;
  model: null | string;
  sessionId: string;
  usage: TokenUsage;
}

/** PR créée par l'agent d'une session, repérée dans son fil. */
export interface RecordedPullRequest {
  at: Date;
  sessionId: string;
  url: string;
}

/** Ce que la page Usage lit de la base : les tours, les PR et le journal (pour le temps de travail des agents). */
export interface UsageRepository {
  firstTurnAt(): Promise<Date | null>;
  /** Entrées du journal depuis une date, dans l'ordre de chaque session */
  listActivity(from: Date | null): Promise<{ at: Date; kind: string; sessionId: string }[]>;
  listPullRequests(from: Date | null): Promise<RecordedPullRequest[]>;
  listTurns(from: Date | null): Promise<RecordedTurn[]>;
}

/** Relit tout le transcript d'une session ; null quand il n'existe plus. */
export interface TranscriptReplay {
  read(profile: string, sessionId: string): Promise<null | TranscriptEvent[]>;
}

/** Sessions lues avant que l'usage de chaque tour soit gardé, et l'écriture de cet usage une fois relu. */
export interface UsageBackfillRepository {
  listIncompleteUsage(): Promise<Session[]>;
  replaceUsage(session: Session): Promise<void>;
}
