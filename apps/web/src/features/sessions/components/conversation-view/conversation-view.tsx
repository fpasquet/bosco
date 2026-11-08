import { RadioTower } from 'lucide-react';
import type { ConversationTurnDto, SessionConversationDto } from '@bosco/domain';
import { Bubble, BubbleContent } from '@/shared/ui/bubble';
import { Message, MessageContent, MessageHeader } from '@/shared/ui/message';
import type { Todo } from '../../lib/conversation';
import { planOf, sourcesOf } from '../../lib/conversation';
import { clockOf } from '../../lib/detail';
import { AgentParts } from '../agent-parts';
import { PlanQueue } from '../plan-queue';
import { SourcesList } from '../sources-list';

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
          {turn.viaChannel && (
            <span className="inline-flex items-center gap-1">
              · <RadioTower aria-hidden className="size-3" /> depuis Bosco
            </span>
          )}
        </MessageHeader>
        <Bubble variant="tinted">
          <BubbleContent className="whitespace-pre-line">{text}</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

/** Le tour de l'agent : ses réponses en Markdown, entre elles ses étapes, puis les pages consultées (Sources). */
function AgentTurn({
  current,
  live,
  plan,
  turn,
}: {
  current: boolean;
  live: boolean;
  /** État du plan de l'agent à la fin de ce tour, quand il l'a changé (Queue) */
  plan?: Todo[];
  turn: ConversationTurnDto;
}) {
  const sources = sourcesOf(turn.parts);
  return (
    <Message>
      <MessageContent>
        <MessageHeader className="gap-1.5 px-0">
          Agent · <Time at={turn.at} />
        </MessageHeader>
        <AgentParts parts={turn.parts} live={live} current={current} />
        {plan && plan.length > 0 && <PlanQueue todos={plan} live={live && current} />}
        {sources.length > 0 && <SourcesList sources={sources} />}
      </MessageContent>
    </Message>
  );
}

/**
 * Fil complet d'une session (E2a), sur les patterns d'AI Elements : tes demandes en bulles (Message), les réponses de
 * l'agent en Markdown, ses réflexions (Reasoning) et ses outils (Tool, Terminal, Test Results, Stack Trace, Task).
 */
export function ConversationView({ conversation, live }: ConversationViewProps) {
  const { plans, turns } = planOf(conversation.turns);
  const last = turns.at(-1);
  return (
    <div className="flex flex-col gap-5">
      {conversation.partial && (
        <p className="text-xs text-muted">Longue session : seuls ses derniers échanges sont affichés.</p>
      )}
      {turns.map((turn) =>
        turn.role === 'user' ? (
          <UserTurn key={turn.id} turn={turn} />
        ) : (
          <AgentTurn key={turn.id} turn={turn} live={live} current={live && turn === last} plan={plans.get(turn.id)} />
        ),
      )}
    </div>
  );
}
