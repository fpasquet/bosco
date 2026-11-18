import type { FileChange } from './file-change.ts';
import type { TokenUsage } from './token-usage.ts';

/**
 * Ce qu'une ligne de transcript dit d'une session, une fois lue. Le format de Claude Code est interne et change d'une
 * version à l'autre : l'adaptateur n'en garde que ces faits, et tout le reste est ignoré.
 */
export interface TranscriptEvent {
  /** Moment de l'événement ; absent pour les lignes de métadonnées (titre) */
  at: Date | null;
  /** Dossier et branche de travail au moment de l'événement */
  branch: null | string;
  /** Fichier modifié par l'outil appelé (Edit, MultiEdit, Write) */
  change?: FileChange | null;
  cwd: null | string;
  /** pullRequest : une PR créée par l'agent (`gh pr create`), dont `text` est l'adresse */
  kind: 'prompt' | 'pullRequest' | 'reply' | 'title' | 'tool';
  /** Question posée par l'agent (outil AskUserQuestion) : elle attend ta réponse */
  question?: null | string;
  model: null | string;
  /** Racine git du dossier de travail, trouvée par l'adaptateur : elle donne le projet de la session */
  projectRoot: null | string;
  /** Texte court : message, nom et argument d'un outil, ou titre */
  text: string;
  usage: null | TokenUsage;
}

/**
 * Entrée du journal d'une session : numérotée, jamais modifiée. Ce que dit le transcript, ou ce que Bosco a vu du
 * pilotage : « Approuver pour moi » suspendu par Claude Code après des refus, de suite ou au total.
 */
export type JournalEntry =
  | { at: Date; count: number; kind: 'autoModeSuspended'; seq: number; total: boolean }
  | { at: Date; kind: 'prompt' | 'reply' | 'tool'; seq: number; text: string };

/** Usage d'une réponse de l'agent (un tour du compte de la page Usage), avec son modèle et son heure. */
export interface TurnUsage {
  at: Date;
  model: null | string;
  usage: TokenUsage;
}

/** PR créée par l'agent dans une session, repérée dans son fil : la commande qui la crée et l'adresse rendue. */
export interface CreatedPullRequest {
  at: Date;
  url: string;
}
