// Flux JSON de `claude -p --output-format stream-json` : seules les lignes utiles au worker sont lues, le reste est
// ignoré (format interne de Claude Code, NF-08).
import type { AgentEvent } from '../../application/ports.ts';

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

export function agentEventOf(raw: string): AgentEvent | null {
  const line = parse(raw);
  if (!line) return null;
  if (line.type === 'system' && line.subtype === 'init' && typeof line.session_id === 'string')
    return { kind: 'session', sessionId: line.session_id };
  if (line.type === 'assistant' && typeof line.message === 'object' && line.message !== null)
    return usageOf(line.message as Line);
  if (line.type === 'result') return resultOf(line);
  return null;
}
