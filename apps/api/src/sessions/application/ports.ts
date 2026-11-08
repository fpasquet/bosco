import type { Conversation } from '../domain/conversation.ts';
import type { ProfileCandidate } from '../domain/profile-candidate.ts';
import type { Session } from '../domain/session.ts';
import type { SettingsSnapshot } from '../domain/settings.ts';
import type { Source } from '../domain/source.ts';
import type { JournalEntry } from '../domain/transcript-event.ts';
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
}

/** Lit les transcripts d'un profil depuis une date, puis suit leurs ajouts, sans jamais les modifier. */
export interface TranscriptWatcher {
  /** Arrête la lecture d'un profil ; rien n'est effacé (CA-SESS-56) */
  unwatch(sourceId: string): Promise<void>;
  watch(source: Source, since: Date): Promise<void>;
}

export interface SettingsRepository {
  load(): Promise<null | SettingsSnapshot>;
  save(settings: SettingsSnapshot): Promise<void>;
}

/** Notification du bureau, envoyée par le service même quand Bosco n'est pas au premier plan (RF-SESS-08). */
export interface Notifier {
  notify(title: string, body: string): void;
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

/** Réglages d'un profil Claude Code (<profil>/settings.json) : Bosco y ajoute ses hooks sans rien remplacer. */
export interface ProfileSettings {
  /** Hooks de Bosco ajoutés aux réglages ; `backup` garde d'abord une copie des réglages actuels (CA-SESS-62) */
  install(profilePath: string, endpoint: HookEndpoint, backup: boolean): Promise<{ backupPath: null | string }>;
  isInstalled(profilePath: string, endpoint: HookEndpoint): Promise<boolean>;
  /** Retire les seuls hooks de Bosco : les réglages redeviennent ceux d'avant l'installation (CA-SESS-63) */
  uninstall(profilePath: string, endpoint: HookEndpoint): Promise<void>;
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
