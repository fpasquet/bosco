import type { TranscriptEvent } from '../../domain/transcript-event.ts';
// Lecture d'une ligne de transcript de Claude Code. Le format est interne et change d'une version à l'autre (DT-05) :
// on ne garde que quelques faits, et toute ligne inconnue, incomplète ou mal formée est ignorée sans erreur (NF-08).
import { TokenUsage } from '../../domain/token-usage.ts';

export interface ParsedLine {
  event: TranscriptEvent;
  sessionId: string;
}

const TEXT_LIMIT = 280;

/** Une session lue en plusieurs fois garde ce suivi : un message de l'assistant écrit bloc par bloc répète son usage. */
export class TranscriptParser {
  private readonly countedMessages = new Set<string>();

  parse(line: string): ParsedLine[] {
    const record = parseJson(line);
    if (!record) return [];
    const sessionId = text(record.sessionId);
    if (!sessionId || record.isSidechain === true || record.isMeta === true) return [];
    const base = {
      at: date(record.timestamp),
      cwd: text(record.cwd),
      branch: text(record.gitBranch),
      model: null,
      usage: null,
    };
    switch (record.type) {
      case 'ai-title': {
        const title = text(record.aiTitle);
        return title ? [{ sessionId, event: { ...base, kind: 'title', text: title } }] : [];
      }
      case 'user':
        return this.userEvents(sessionId, base, record.message);
      case 'assistant':
        return this.assistantEvents(sessionId, base, record.message);
      default:
        return [];
    }
  }

  private userEvents(sessionId: string, base: Base, message: unknown): ParsedLine[] {
    const content = isRecord(message) ? message.content : undefined;
    const prompt = typeof content === 'string' ? content : textBlocks(content);
    // Les résultats d'outils reviennent aussi en lignes « user » : ce ne sont pas des messages de la personne
    if (!prompt) return [];
    return [{ sessionId, event: { ...base, kind: 'prompt', text: shorten(prompt) } }];
  }

  private assistantEvents(sessionId: string, base: Base, message: unknown): ParsedLine[] {
    if (!isRecord(message)) return [];
    const model = text(message.model);
    const messageId = text(message.id);
    const usage = messageId && !this.countedMessages.has(messageId) ? tokenUsage(message.usage) : null;
    if (messageId && usage) this.countedMessages.add(messageId);
    const blocks = Array.isArray(message.content) ? message.content.filter(isRecord) : [];
    const events = blocks
      .flatMap((block) => blockEvent(block))
      .map((event) => ({ sessionId, event: { ...base, model, ...event } }));
    // L'usage s'attache au premier événement de la ligne ; une ligne sans bloc lisible le garde quand même
    if (usage) {
      const first = events[0];
      if (first) first.event = { ...first.event, usage };
      else events.push({ sessionId, event: { ...base, model, usage, kind: 'tool', text: '' } });
    }
    return events.filter((parsed) => parsed.event.text !== '' || parsed.event.usage);
  }
}

type Base = Pick<TranscriptEvent, 'at' | 'branch' | 'cwd' | 'model' | 'usage'>;

/** Bloc d'un message de l'assistant : son texte, ou l'outil appelé et son argument principal. */
function blockEvent(block: Record<string, unknown>): Pick<TranscriptEvent, 'kind' | 'text' | 'usage'>[] {
  const content = text(block.text);
  if (block.type === 'text' && content) return [{ kind: 'reply', text: shorten(content), usage: null }];
  if (block.type === 'tool_use' && text(block.name)) return [{ kind: 'tool', text: toolSummary(block), usage: null }];
  return [];
}

function parseJson(line: string): null | Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(line);
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): null | string {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function date(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

function tokenUsage(value: unknown): null | TokenUsage {
  if (!isRecord(value)) return null;
  const usage = new TokenUsage(
    count(value.input_tokens),
    count(value.output_tokens),
    count(value.cache_creation_input_tokens),
    count(value.cache_read_input_tokens),
  );
  return usage.total > 0 ? usage : null;
}

function textBlocks(content: unknown): null | string {
  if (!Array.isArray(content)) return null;
  const texts = content
    .filter(isRecord)
    .flatMap((block) => (block.type === 'text' && text(block.text) ? [block.text as string] : []));
  return texts.length ? texts.join('\n') : null;
}

function toolSummary(block: Record<string, unknown>): string {
  const input = isRecord(block.input) ? block.input : {};
  const detail = text(input.command) ?? text(input.file_path) ?? text(input.pattern) ?? text(input.url) ?? '';
  return shorten(detail ? `${String(block.name)} · ${detail}` : String(block.name));
}

function shorten(value: string): string {
  const single = value.replaceAll(/\s+/g, ' ').trim();
  return single.length > TEXT_LIMIT ? `${single.slice(0, TEXT_LIMIT - 1)}…` : single;
}
