// Flux JSON de `claude -p --output-format stream-json` : seules les lignes utiles au worker sont lues, le reste est
// ignoré (format interne de Claude Code, NF-08).
import type { AgentEvent } from '../../application/ports.ts';
import { quotaWindowsOf } from '../../../shared/domain/subscription-quota.ts';
import { connectorReadOf, hasAtlassianConnector } from '../../domain/atlassian-read.ts';

type Line = Record<string, unknown>;

const count = (value: unknown) => (typeof value === 'number' && value >= 0 ? value : 0);

function parse(raw: string): Line | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Line) : null;
  } catch {
    return null;
  }
}

function usageOf(message: Line): AgentEvent {
  const usage = (message.usage ?? {}) as Line;
  return {
    kind: 'usage',
    model: typeof message.model === 'string' ? message.model : null,
    usage: {
      input: count(usage.input_tokens),
      output: count(usage.output_tokens),
      cacheCreation: count(usage.cache_creation_input_tokens),
      cacheRead: count(usage.cache_read_input_tokens),
    },
  };
}

/** Lectures dans Jira et Confluence demandées par un message de l'agent (CA-CONT-94). */
function readsOf(message: Line): AgentEvent[] {
  const content = Array.isArray(message.content) ? (message.content as unknown[]) : [];
  return content.flatMap((part) => {
    if (typeof part !== 'object' || part === null) return [];
    const { input, name, type } = part as Line;
    if (type !== 'tool_use' || typeof name !== 'string') return [];
    const read = connectorReadOf(name, input);
    return read ? [{ kind: 'read' as const, ...read }] : [];
  });
}

const STOPS: Record<string, 'max_turns' | 'success'> = { error_max_turns: 'max_turns', success: 'success' };

function resultOf(line: Line): AgentEvent {
  const stop = STOPS[String(line.subtype)] ?? 'error';
  return {
    kind: 'result',
    ok: stop === 'success' && line.is_error !== true,
    report: typeof line.result === 'string' ? line.result : null,
    stop,
    turns: count(line.num_turns),
  };
}

export function agentEventsOf(raw: string): AgentEvent[] {
  const line = parse(raw);
  if (!line) return [];
  if (line.type === 'system' && line.subtype === 'init' && typeof line.session_id === 'string') {
    const tools = Array.isArray(line.tools) ? line.tools.filter((tool) => typeof tool === 'string') : [];
    return [
      { kind: 'session', sessionId: line.session_id },
      { kind: 'connector', available: hasAtlassianConnector(tools) },
    ];
  }
  if (line.type === 'assistant' && typeof line.message === 'object' && line.message !== null) {
    const message = line.message as Line;
    return [usageOf(message), ...readsOf(message)];
  }
  if (line.type === 'result') return [resultOf(line)];
  const windows = quotaWindowsOf(line);
  if (windows) return [{ kind: 'quota', windows }];
  return [];
}
