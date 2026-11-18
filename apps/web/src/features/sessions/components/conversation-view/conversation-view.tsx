import { RadioTower } from 'lucide-react';
import { Fragment } from 'react';
import type { ConversationTurnDto, SessionConversationDto } from '@bosco/domain';
import { Markdown } from '@/shared/components/markdown';
import { Bubble, BubbleContent } from '@/shared/ui/bubble';
import { Message, MessageContent, MessageHeader } from '@/shared/ui/message';
import type { Todo } from '../../lib/conversation';
import { planOf, sourcesOf } from '../../lib/conversation';
import { clockOf } from '../../lib/detail';
import { placeRefusals, type Refusal, type RefusalLine, splitAtRefusals } from '../../lib/refusals';
import { AgentParts } from '../agent-parts';
import { AutoModeSuspended, type AutoModeSuspension } from '../auto-mode-suspended';
import { PlanQueue } from '../plan-queue';
import { SandboxRefusal, type SandboxRefusalsProps } from '../sandbox-refusals';
import { SourcesList } from '../sources-list';

export interface ConversationViewProps {
  conversation: SessionConversationDto;
  /** La session tourne : l'outil sans résultat est en cours, et non interrompu */
  live: boolean;
  /** Suspensions d'« Approuver pour moi » du journal, placées à leur heure entre les tours */
  notices?: AutoModeSuspension[];
  /** Sorties réseau refusées d'un bac à sable, placées à leur heure dans le tour de l'agent */
  refusals?: { list: readonly Refusal[]; project: SandboxRefusalsProps['project'] };
}

function Time({ at }: { at: string }) {
  return (
    <time dateTime={at} className="font-mono tabular-nums">
      {clockOf(at)}
    </time>
  );
}

/** Ta demande : une bulle à droite, en Markdown comme les réponses, chaque retour à la ligne gardé. */
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
          <BubbleContent>
            <Markdown breaks>{text}</Markdown>
          </BubbleContent>
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
  refusals = [],
  refusalsProject = null,
  turn,
}: {
  current: boolean;
  live: boolean;
  /** État du plan de l'agent à la fin de ce tour, quand il l'a changé (Queue) */
  plan?: Todo[];
  refusals?: RefusalLine[];
  refusalsProject?: SandboxRefusalsProps['project'];
  turn: ConversationTurnDto;
}) {
  const sources = sourcesOf(turn.parts);
  const segments = splitAtRefusals(turn.parts, refusals);
  return (
    <Message>
      <MessageContent>
        <MessageHeader className="gap-1.5 px-0">
          Agent · <Time at={turn.at} />
        </MessageHeader>
        {segments.map((segment, index) => (
          // Les refus d'un tour ne changent pas d'ordre : leur position est leur identité
          <Fragment key={index}>
            <AgentParts parts={segment.parts} live={live} current={current && index === segments.length - 1} />
            {segment.refusal && <SandboxRefusal {...segment.refusal} project={refusalsProject} />}
          </Fragment>
        ))}
        {plan && plan.length > 0 && <PlanQueue todos={plan} live={live && current} />}
        {sources.length > 0 && <SourcesList sources={sources} />}
      </MessageContent>
    </Message>
  );
}

/**
 * Fil complet d'une session, sur les patterns d'AI Elements : tes demandes en bulles (Message), les réponses de
 * l'agent en Markdown, ses réflexions (Reasoning) et ses outils (Tool, Terminal, Test Results, Stack Trace, Task).
 */
export function ConversationView({ conversation, live, notices = [], refusals }: ConversationViewProps) {
  const { plans, turns } = planOf(conversation.turns);
  const placed = placeRefusals(turns, refusals?.list ?? []);
  const project = refusals?.project ?? null;
  const last = turns.at(-1);
  // Une suspension vient avant le premier tour commencé après elle
  const before = (turn: ConversationTurnDto) =>
    notices.filter(
      (notice) => notice.at < turn.at && !turns.some((other) => other.at < turn.at && notice.at < other.at),
    );
  const after = notices.filter((notice) => !turns.some((turn) => notice.at < turn.at));
  return (
    <div className="flex flex-col gap-5">
      {conversation.partial && (
        <p className="text-xs text-muted">Longue session : seuls ses derniers échanges sont affichés.</p>
      )}
      {turns.map((turn) => (
        <Fragment key={turn.id}>
          {before(turn).map((notice) => (
            <AutoModeSuspended key={notice.seq} suspended={notice} />
          ))}
          {turn.role === 'user' ? (
            <UserTurn turn={turn} />
          ) : (
            <AgentTurn
              turn={turn}
              live={live}
              current={live && turn === last}
              plan={plans.get(turn.id)}
              refusals={placed.byTurn.get(turn.id)}
              refusalsProject={project}
            />
          )}
        </Fragment>
      ))}
      {after.map((notice) => (
        <AutoModeSuspended key={notice.seq} suspended={notice} />
      ))}
      {placed.rest.map((line) => (
        <SandboxRefusal key={line.host} {...line} project={project} />
      ))}
    </div>
  );
}
