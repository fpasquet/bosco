import type { ConversationPartDto } from '@bosco/domain';
import { Markdown } from '@/shared/components/markdown';
import { groupParts } from '../../lib/conversation';
import { StepGroup } from '../step-group';

export interface AgentPartsProps {
  /** Dernières parties d'un agent qui travaille : son dernier groupe d'étapes reste ouvert */
  current: boolean;
  live: boolean;
  parts: ConversationPartDto[];
}

/** Ce que fait un agent, dans l'ordre : ses textes en Markdown, et entre eux ses étapes (Chain of Thought). */
export function AgentParts({ current, live, parts }: AgentPartsProps) {
  const groups = groupParts(parts);
  return groups.map((group, index) =>
    group.kind === 'text' ? (
      // Les parties d'un tour ne changent pas d'ordre : leur position est leur identité
      <Markdown key={index}>{group.text}</Markdown>
    ) : (
      <StepGroup key={index} steps={group.steps} live={live} current={current && index === groups.length - 1} />
    ),
  );
}
