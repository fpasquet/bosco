import type { ProfileCandidate } from '../domain/profile-candidate.ts';
import type { Session } from '../domain/session.ts';
import type { Source } from '../domain/source.ts';
import type { JournalEntry } from '../domain/transcript-event.ts';

export interface SessionRepository {
  find(id: string): Promise<null | Session>;
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
  watch(source: Source, since: Date): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}
