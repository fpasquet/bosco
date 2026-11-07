import type { JournalEntry, TranscriptEvent } from './transcript-event.ts';
import { TokenUsage } from './token-usage.ts';

/** États d'une session (RF-SESS-02). Sans suivi en direct, seuls running et inactive peuvent se déduire. */
export type SessionState = 'inactive' | 'running';

/** Délai sans événement après lequel une session ouverte devient Inactive (réglable dans les sources). */
export const DEFAULT_INACTIVITY_DELAY_MS = 15 * 60 * 1000;

export interface SessionSnapshot {
  branch: null | string;
  id: string;
  lastEventAt: Date;
  lastMessage: null | string;
  model: null | string;
  nextSeq: number;
  repoPath: null | string;
  sourceId: string;
  startedAt: Date;
  title: null | string;
  usage: TokenUsage;
}

/** Une session Claude Code, découverte dans un dossier surveillé : son contexte, son usage et son journal. */
export class Session {
  private readonly pending: JournalEntry[] = [];

  private constructor(private snapshot: SessionSnapshot) {}

  get id(): string {
    return this.snapshot.id;
  }

  get lastEventAt(): Date {
    return this.snapshot.lastEventAt;
  }

  static discover(id: string, sourceId: string, at: Date): Session {
    return new Session({
      id,
      sourceId,
      repoPath: null,
      branch: null,
      title: null,
      model: null,
      startedAt: at,
      lastEventAt: at,
      lastMessage: null,
      usage: TokenUsage.ZERO,
      nextSeq: 1,
    });
  }

  static restore(snapshot: SessionSnapshot): Session {
    return new Session({ ...snapshot });
  }

  /** Tient compte d'un événement lu dans le transcript : contexte, usage, dernier message, journal. */
  record(event: TranscriptEvent): void {
    const current = this.snapshot;
    const at = event.at ?? current.lastEventAt;
    this.snapshot = {
      ...current,
      repoPath: event.cwd ?? current.repoPath,
      branch: event.branch ?? current.branch,
      model: event.model ?? current.model,
      usage: event.usage ? current.usage.add(event.usage) : current.usage,
      startedAt: at < current.startedAt ? at : current.startedAt,
      lastEventAt: at > current.lastEventAt ? at : current.lastEventAt,
    };
    if (event.kind === 'title') {
      this.snapshot = { ...this.snapshot, title: event.text };
      return;
    }
    if (event.kind !== 'tool') this.snapshot = { ...this.snapshot, lastMessage: event.text };
    this.pending.push({ seq: this.snapshot.nextSeq, at, kind: event.kind, text: event.text });
    this.snapshot = { ...this.snapshot, nextSeq: this.snapshot.nextSeq + 1 };
  }

  /** État à un instant donné : En cours tant qu'un événement est récent, puis Inactive (RF-SESS-02). */
  stateAt(now: Date, inactivityDelayMs = DEFAULT_INACTIVITY_DELAY_MS): SessionState {
    return now.getTime() - this.snapshot.lastEventAt.getTime() < inactivityDelayMs ? 'running' : 'inactive';
  }

  /** Entrées du journal ajoutées depuis le dernier enregistrement, à écrire une seule fois. */
  pullJournal(): JournalEntry[] {
    return this.pending.splice(0);
  }

  toSnapshot(): SessionSnapshot {
    return { ...this.snapshot };
  }
}
