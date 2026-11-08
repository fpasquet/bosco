import type { ConversationPartDto, SessionConversationDto } from '@bosco/domain';
import type { Conversation, ConversationPart } from '../../domain/conversation.ts';

function presentPart(part: ConversationPart): ConversationPartDto {
  const at = part.at.toISOString();
  if (part.kind === 'tool') return { ...part, at, endedAt: part.endedAt?.toISOString() ?? null };
  return { ...part, at };
}

/** Conversation en JSON : dates en ISO 8601. */
export function presentConversation(conversation: Conversation): SessionConversationDto {
  return {
    partial: conversation.partial,
    turns: conversation.turns.map((turn) => ({
      at: turn.at.toISOString(),
      id: turn.id,
      parts: turn.parts.map(presentPart),
      role: turn.role,
    })),
  };
}
