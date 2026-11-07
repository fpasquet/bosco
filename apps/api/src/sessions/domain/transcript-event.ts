import type { TokenUsage } from './token-usage.ts';

/**
 * Ce qu'une ligne de transcript dit d'une session, une fois lue. Le format de Claude Code est interne et change d'une
 * version à l'autre (DT-05) : l'adaptateur n'en garde que ces faits, et tout le reste est ignoré (NF-08).
 */
export interface TranscriptEvent {
  /** Moment de l'événement ; absent pour les lignes de métadonnées (titre) */
  at: Date | null;
  /** Dossier et branche de travail au moment de l'événement */
  branch: null | string;
  cwd: null | string;
  kind: 'prompt' | 'reply' | 'title' | 'tool';
  model: null | string;
  /** Texte court : message, nom et argument d'un outil, ou titre */
  text: string;
  usage: null | TokenUsage;
}

/** Entrée du journal d'une session : numérotée, jamais modifiée. */
export interface JournalEntry {
  at: Date;
  kind: 'prompt' | 'reply' | 'tool';
  seq: number;
  text: string;
}
