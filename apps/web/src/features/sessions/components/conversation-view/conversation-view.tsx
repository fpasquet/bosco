import type { ConversationTurnDto, SessionConversationDto } from '@bosco/domain';
import { Markdown } from '@/shared/components/markdown';
import { Bubble, BubbleContent } from '@/shared/ui/bubble';
import { Message, MessageContent, MessageHeader } from '@/shared/ui/message';
import { groupParts } from '../../lib/conversation';
import { clockOf } from '../../lib/detail';
import { StepGroup } from '../step-group';

export interface ConversationViewProps {
  conversation: SessionConversationDto;
  /** La session tourne : l'outil sans résultat est en cours, et non interrompu */
  live: boolean;
}

function Time({ at }: { at: string }) {
  return (
    <time dateTime={at} className="font-mono tabular-nums">
      {clockOf(at)}
    </time>
  );
}

/** Ta demande : une bulle à droite, le texte tel que tu l'as écrit. */
function UserTurn({ turn }: { turn: ConversationTurnDto }) {
  const text = turn.parts.map((part) => (part.kind === 'text' ? part.text : '')).join('\n');
  return (
    <Message align="end">
      <MessageContent>
        <MessageHeader className="gap-1.5">
          Toi · <Time at={turn.at} />
        </MessageHeader>
        <Bubble variant="tinted">
          <BubbleContent className="whitespace-pre-line">{text}</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

/** Le tour de l'agent : ses réponses en Markdown, et entre elles ses étapes (réflexions, outils). */
function AgentTurn({ current, live, turn }: { current: boolean; live: boolean; turn: ConversationTurnDto }) {
  const groups = groupParts(turn.parts);
  return (
    <Message>
      <MessageContent>
        <MessageHeader className="gap-1.5 px-0">
          Agent · <Time at={turn.at} />
        </MessageHeader>
        {groups.map((group, index) =>
          group.kind === 'text' ? (
            // les parties d'un tour ne changent pas d'ordre
            <Markdown key={index}>{group.text}</Markdown>
          ) : (
            <StepGroup
              // les parties d'un tour ne changent pas d'ordre
              key={index}
              steps={group.steps}
              live={live}
              current={current && index === groups.length - 1}
            />
          ),
        )}
      </MessageContent>
    </Message>
  );
}

/**
 * Fil complet d'une session (E2a), sur les patterns d'AI Elements : tes demandes en bulles (Message), les réponses de
 * l'agent en Markdown, ses réflexions (Reasoning) et ses outils (Tool, Terminal, Test Results, Stack Trace, Task).
 */
export function ConversationView({ conversation, live }: ConversationViewProps) {
  const last = conversation.turns.at(-1);
  return (
    <div className="flex flex-col gap-5">
      {conversation.partial && (
        <p className="text-xs text-muted">Longue session : seuls ses derniers échanges sont affichés.</p>
      )}
      {conversation.turns.map((turn) =>
        turn.role === 'user' ? (
          <UserTurn key={turn.id} turn={turn} />
        ) : (
          <AgentTurn key={turn.id} turn={turn} live={live} current={live && turn === last} />
        ),
      )}
    </div>
  );
}
