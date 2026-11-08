import type { ConversationPartDto } from '@bosco/domain';
import { Markdown } from '@/shared/components/markdown';
import { AgentParts } from '../agent-parts';

export interface SubagentWorkProps {
  agentType: null | string;
  live: boolean;
  model: null | string;
  parts: ConversationPartDto[];
  partial: boolean;
  prompt: string;
  result: null | string;
}

/** Subagent : son type et son modèle, la consigne reçue, ses étapes au fil de l'eau, puis son résultat. */
export function SubagentWork({ agentType, live, model, parts, partial, prompt, result }: SubagentWorkProps) {
  return (
    <div className="flex flex-col gap-3">
      {(model || agentType) && (
        <div className="flex flex-wrap gap-1.5">
          {model && <span className="badge badge-soft badge-sm">{model}</span>}
          {agentType && <span className="badge badge-outline font-mono badge-sm">{agentType}</span>}
        </div>
      )}
      {prompt && <p className="line-clamp-4 whitespace-pre-line text-ink">{prompt}</p>}
      {partial && <p className="text-xs text-muted">Seules ses dernières étapes sont affichées.</p>}
      {parts.length > 0 && <AgentParts parts={parts} live={live} current={live && !result} />}
      {result && <Markdown>{result}</Markdown>}
    </div>
  );
}
