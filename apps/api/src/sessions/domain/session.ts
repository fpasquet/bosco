import type { JournalEntry, TranscriptEvent } from './transcript-event.ts';
import { estimateCostMicros } from './model-pricing.ts';
import { TokenUsage } from './token-usage.ts';

/**
 * États d'une session (RF-SESS-02). Sans suivi en direct, running et inactive se déduisent de l'activité, ended du
 * registre des sessions ouvertes que tient Claude Code.
 */
export type SessionState = 'ended' | 'inactive' | 'running';

/** Délai sans événement après lequel une session ouverte devient Inactive (réglable dans les sources). */
export const DEFAULT_INACTIVITY_DELAY_MS = 15 * 60 * 1000;

const RECENT_ACTIONS = 3;

/** Une commande (« <command-name>/clear</command-name> ») ne dit rien du sujet de la session. */
function isTitleWorthy(prompt: string): boolean {
  return !prompt.trimStart().startsWith('<');
}

export interface SessionSnapshot {
  branch: null | string;
  /** Coût estimé en micro-dollars des tokens dont le modèle a un tarif connu (RF-SESS-05) */
  costMicros: number;
  id: string;
  /** Dernier outil appelé par l'agent (« Bash · npm test ») */
  lastAction: null | string;
  /** Trois dernières actions de l'agent, la plus récente en premier (CA-SESS-15) */
  recentActions: string[];
  lastEventAt: Date;
  lastMessage: null | string;
  model: null | string;
  nextSeq: number;
  repoPath: null | string;
  repoRoot: null | string;
  sourceId: string;
  startedAt: Date;
  title: null | string;
  /** Tokens d'un modèle sans tarif connu : la session est alors « non chiffrée » pour cette part */
  unpricedTokens: number;
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
      repoRoot: null,
      branch: null,
      lastAction: null,
      recentActions: [],
      costMicros: 0,
      unpricedTokens: 0,
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
    return new Session({ ...snapshot, recentActions: [...snapshot.recentActions] });
  }

  /** Tient compte d'un événement lu dans le transcript : contexte, usage, dernier message, journal. */
  record(event: TranscriptEvent): void {
    const current = this.snapshot;
    const at = event.at ?? current.lastEventAt;
    this.snapshot = {
      ...current,
      repoPath: event.cwd ?? current.repoPath,
      repoRoot: event.repoRoot ?? current.repoRoot,
      branch: event.branch ?? current.branch,
      model: event.model ?? current.model,
      usage: event.usage ? current.usage.add(event.usage) : current.usage,
      ...this.costOf(event),
      startedAt: at < current.startedAt ? at : current.startedAt,
      lastEventAt: at > current.lastEventAt ? at : current.lastEventAt,
    };
    if (event.kind === 'title') {
      this.snapshot = { ...this.snapshot, title: event.text };
      return;
    }
    if (event.text === '') return;
    if (event.kind === 'prompt' && this.snapshot.title === null && isTitleWorthy(event.text))
      // Sans titre de Claude Code (échange trop court), la première demande en tient lieu, comme dans /resume
      this.snapshot = { ...this.snapshot, title: event.text };
    this.snapshot =
      event.kind === 'tool'
        ? {
            ...this.snapshot,
            lastAction: event.text,
            recentActions: [event.text, ...this.snapshot.recentActions].slice(0, RECENT_ACTIONS),
          }
        : { ...this.snapshot, lastMessage: event.text };
    this.pending.push({ seq: this.snapshot.nextSeq, at, kind: event.kind, text: event.text });
    this.snapshot = { ...this.snapshot, nextSeq: this.snapshot.nextSeq + 1 };
  }

  /** Coût de l'usage d'un événement, au tarif du modèle qui l'a produit (une session peut changer de modèle). */
  private costOf(event: TranscriptEvent): Pick<SessionSnapshot, 'costMicros' | 'unpricedTokens'> {
    const { costMicros, unpricedTokens } = this.snapshot;
    if (!event.usage) return { costMicros, unpricedTokens };
    const cost = estimateCostMicros(event.model ?? this.snapshot.model, event.usage);
    return cost === null
      ? { costMicros, unpricedTokens: unpricedTokens + event.usage.total }
      : { costMicros: costMicros + cost, unpricedTokens };
  }

  /**
   * État à un instant donné : Terminée dès que Claude Code ne la tient plus pour ouverte, sinon En cours tant qu'un
   * événement est récent, puis Inactive (RF-SESS-02). `open` : null quand le profil ne dit pas ce qui est ouvert.
   */
  stateAt(now: Date, open: boolean | null = null, inactivityDelayMs = DEFAULT_INACTIVITY_DELAY_MS): SessionState {
    if (open === false) return 'ended';
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
