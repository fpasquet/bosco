import type { JournalEntry, TranscriptEvent } from './transcript-event.ts';
import { estimateCostMicros } from './model-pricing.ts';
import { TokenUsage } from './token-usage.ts';

/**
 * États d'une session (RF-SESS-02). running et inactive se déduisent de l'activité, ended du registre des sessions
 * ouvertes que tient Claude Code, waiting des signaux du suivi en direct (autorisation demandée, tour terminé).
 */
export type SessionState = 'ended' | 'inactive' | 'running' | 'waiting';

/** Ce qu'attend une session de la personne : une autorisation (RF-SESS-03) ou une réponse à la fin du tour (RF-SESS-04). */
export type Waiting =
  | { detail: null | string; kind: 'permission'; requestId: string; since: Date; tool: string }
  | { kind: 'turn'; message: null | string; since: Date };

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
  /** Fin signalée par le suivi en direct ; une reprise de la session l'efface */
  endedAt: Date | null;
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
  waiting: null | Waiting;
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
      waiting: null,
      endedAt: null,
    });
  }

  static restore(snapshot: SessionSnapshot): Session {
    return new Session({
      ...snapshot,
      recentActions: [...snapshot.recentActions],
      waiting: snapshot.waiting ?? null,
      endedAt: snapshot.endedAt ?? null,
    });
  }

  get waiting(): null | Waiting {
    return this.snapshot.waiting;
  }

  /** Le suivi en direct signale une autorisation demandée : la session t'attend jusqu'à la réponse (RF-SESS-03). */
  awaitPermission(requestId: string, tool: string, detail: null | string, at: Date): void {
    this.touch(at);
    this.snapshot = { ...this.snapshot, waiting: { kind: 'permission', requestId, tool, detail, since: at } };
  }

  /** L'agent a rendu la main : la session t'attend, avec son dernier message, jusqu'à ta réponse dans le terminal. */
  endTurn(message: null | string, at: Date): void {
    this.touch(at);
    const lastMessage = message ?? this.snapshot.lastMessage;
    this.snapshot = { ...this.snapshot, lastMessage, waiting: { kind: 'turn', message: lastMessage, since: at } };
  }

  /** L'autorisation a reçu sa réponse, ici ou dans le terminal : la première réponse l'emporte. */
  settlePermission(requestId: string, at: Date): boolean {
    const { waiting } = this.snapshot;
    if (waiting?.kind !== 'permission' || waiting.requestId !== requestId) return false;
    this.touch(at);
    this.snapshot = { ...this.snapshot, waiting: null };
    return true;
  }

  /** Dossier de travail donné par un signal du suivi en direct, avant que le transcript ne soit lu. */
  placeIn(cwd: null | string): void {
    if (cwd && !this.snapshot.repoPath) this.snapshot = { ...this.snapshot, repoPath: cwd };
  }

  /** La session reprend (démarrage, message envoyé, action de l'agent) : elle n'attend plus rien et reste ouverte. */
  resume(at: Date): void {
    this.touch(at);
    const waiting = this.snapshot.waiting?.kind === 'turn' ? null : this.snapshot.waiting;
    this.snapshot = { ...this.snapshot, waiting, endedAt: null };
  }

  /** Claude Code signale la fin de la session : elle passe Terminée, même sans registre des sessions ouvertes. */
  end(at: Date): void {
    this.touch(at);
    this.snapshot = { ...this.snapshot, waiting: null, endedAt: at };
  }

  /** Une autorisation laissée en attente par un arrêt de Bosco ne peut plus recevoir de réponse depuis Bosco. */
  dropStalePermission(): boolean {
    if (this.snapshot.waiting?.kind !== 'permission') return false;
    this.snapshot = { ...this.snapshot, waiting: null };
    return true;
  }

  private touch(at: Date): void {
    if (at > this.snapshot.lastEventAt) this.snapshot = { ...this.snapshot, lastEventAt: at };
  }

  /** Tient compte d'un événement lu dans le transcript : contexte, usage, dernier message, journal. */
  record(event: TranscriptEvent): void {
    const at = event.at ?? this.snapshot.lastEventAt;
    // Une action plus récente que la fin du tour montre que la session est repartie, même si un signal a été manqué
    const { waiting } = this.snapshot;
    if (waiting?.kind === 'turn' && event.kind !== 'title' && event.at && event.at > waiting.since)
      this.snapshot = { ...this.snapshot, waiting: null };
    const current = this.snapshot;
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
    const { endedAt, lastEventAt, waiting } = this.snapshot;
    if (open === false || (open === null && endedAt)) return 'ended';
    // Une autorisation attend sa réponse sans limite côté Bosco : Claude Code annule lui-même le hook après 10 min
    if (waiting?.kind === 'permission') return 'waiting';
    // Un tour terminé resté sans réponse devient lui aussi Inactive après le délai (RF-SESS-02)
    if (now.getTime() - lastEventAt.getTime() >= inactivityDelayMs) return 'inactive';
    return waiting ? 'waiting' : 'running';
  }

  /** Entrées du journal ajoutées depuis le dernier enregistrement, à écrire une seule fois. */
  pullJournal(): JournalEntry[] {
    return this.pending.splice(0);
  }

  toSnapshot(): SessionSnapshot {
    return { ...this.snapshot };
  }
}
