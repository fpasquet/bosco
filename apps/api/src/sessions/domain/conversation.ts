/**
 * Conversation complète d'une session, lue dans son transcript pour le fil du détail (E2a) : les demandes de la
 * personne, et pour chaque tour de l'agent ses réflexions, ses appels d'outils avec leur entrée et leur résultat, et ses
 * réponses en Markdown. Elle n'est jamais enregistrée : le transcript reste la source, le journal garde l'essentiel.
 */
export type ConversationStep =
  | { at: Date; kind: 'reasoning'; seconds: null | number; text: string }
  | {
      at: Date;
      endedAt: Date | null;
      error: boolean;
      id: string;
      input: Record<string, unknown>;
      kind: 'tool';
      name: string;
      output: null | string;
      /** Sous-agent lancé par cet appel (Agent, Task), lu dans son propre transcript */
      subagent?: Subagent;
      summary: string;
    };

/** Sous-agent : sa consigne, son modèle, ses étapes et son résultat (pattern Subagent). */
export interface Subagent {
  agentType: null | string;
  description: null | string;
  endedAt: Date | null;
  finished: boolean;
  model: null | string;
  /** Ses réflexions, outils et textes, dans l'ordre ; les plus anciens laissés de côté au-delà de la limite */
  parts: ConversationPart[];
  partial: boolean;
  prompt: null | string;
  /** Son dernier texte, une fois fini */
  result: null | string;
  startedAt: Date | null;
}

export type ConversationPart = ConversationStep | { at: Date; kind: 'text'; text: string };

export interface ConversationTurn {
  at: Date;
  id: string;
  parts: ConversationPart[];
  role: 'assistant' | 'user';
  /** Demande écrite dans Bosco et arrivée par le canal de Bosco (E2i) */
  viaChannel?: boolean;
}

export interface Conversation {
  /** Le début d'une longue session n'est pas lu : seuls ses derniers échanges sont rendus */
  partial: boolean;
  turns: ConversationTurn[];
}

/** Nombre de parties rendues au plus : au-delà, les plus anciennes sont laissées de côté. */
export const CONVERSATION_PART_LIMIT = 800;

/** Les derniers tours d'une conversation, jusqu'à `limit` parties en tout ; partial quand il a fallu en couper. */
export function lastParts(turns: ConversationTurn[], limit = CONVERSATION_PART_LIMIT): Conversation {
  const kept: ConversationTurn[] = [];
  let count = 0;
  let partial = false;
  for (const turn of [...turns].reverse()) {
    const room = limit - count;
    if (room <= 0) {
      partial = true;
      break;
    }
    const parts = turn.parts.length > room ? turn.parts.slice(-room) : turn.parts;
    if (parts.length < turn.parts.length) partial = true;
    kept.unshift({ ...turn, parts });
    count += Math.max(parts.length, 1);
  }
  return { partial, turns: kept };
}
