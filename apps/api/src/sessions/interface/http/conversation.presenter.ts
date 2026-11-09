import type { ConversationPartDto, SessionConversationDto, SubagentDto } from '@bosco/domain';
import type { Conversation, ConversationPart, Subagent } from '../../domain/conversation.ts';

function presentSubagent(subagent: Subagent): SubagentDto {
  return {
    ...subagent,
    endedAt: subagent.endedAt?.toISOString() ?? null,
    parts: subagent.parts.map(presentPart),
    startedAt: subagent.startedAt?.toISOString() ?? null,
  };
}

function presentPart(part: ConversationPart): ConversationPartDto {
  const at = part.at.toISOString();
  if (part.kind !== 'tool') return { ...part, at };
  const { subagent, ...tool } = part;
  return {
    ...tool,
    at,
    endedAt: part.endedAt?.toISOString() ?? null,
    ...(subagent ? { subagent: presentSubagent(subagent) } : {}),
  };
}

/** Conversation en JSON : dates en ISO 8601, sous-agents compris. */
export function presentConversation(conversation: Conversation): SessionConversationDto {
  return {
    partial: conversation.partial,
    turns: conversation.turns.map((turn) => ({
      at: turn.at.toISOString(),
      id: turn.id,
      parts: turn.parts.map(presentPart),
      role: turn.role,
      ...(turn.viaChannel ? { viaChannel: true } : {}),
    })),
  };
}
