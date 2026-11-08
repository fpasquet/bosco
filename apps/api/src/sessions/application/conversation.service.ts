import type { Conversation } from '../domain/conversation.ts';
import type { ConversationReader, SessionRepository, SourceRepository } from './ports.ts';

/** Ce que rend la lecture de la conversation d'une session. */
export type ConversationResult =
  | { conversation: Conversation; kind: 'found' }
  /** Le transcript n'existe plus (Claude Code efface les anciennes sessions) : le fil se rabat sur le journal */
  | { kind: 'gone' }
  | { kind: 'unknownSession' };

/** Fil complet d'une session (E2a) : demandes, réflexions, outils et réponses, lus dans son transcript. */
export class ConversationService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly sourceRepository: SourceRepository,
    private readonly reader: ConversationReader,
  ) {}

  async conversation(sessionId: string): Promise<ConversationResult> {
    const session = await this.sessionRepository.find(sessionId);
    if (!session) return { kind: 'unknownSession' };
    const { sourceId } = session.toSnapshot();
    const sources = await this.sourceRepository.list();
    const source = sources.find((candidate) => candidate.id === sourceId);
    const conversation = source ? await this.reader.read(source.path, sessionId) : null;
    return conversation ? { kind: 'found', conversation } : { kind: 'gone' };
  }
}
