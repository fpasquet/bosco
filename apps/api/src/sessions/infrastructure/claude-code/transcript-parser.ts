import type { TranscriptEvent } from '../../domain/transcript-event.ts';
import { describeAction, shorten } from '../../domain/action-summary.ts';
import { channelMessageOf } from '../../domain/channel.ts';
import { changeOf } from '../../domain/file-change.ts';
// Lecture d'une ligne de transcript de Claude Code. Le format est interne et change d'une version à l'autre :
// on ne garde que quelques faits, et toute ligne inconnue, incomplète ou mal formée est ignorée sans erreur.
import { TokenUsage } from '../../domain/token-usage.ts';

export interface ParsedLine {
  event: TranscriptEvent;
  sessionId: string;
}

/** Lignes connues qui ne portent aucun fait lu par Bosco : elles ne disent rien de la lisibilité du format. */
const SILENT_TYPES = new Set([
  'attachment',
  'file-history-snapshot',
  'progress',
  'queue-operation',
  'summary',
  'system',
]);

/**
 * La ligne est d'un genre connu sans fait à lire (résumé, instantané des fichiers, ligne méta ou de sous-agent) :
 * qu'elle ne donne rien ne dit pas que le format a changé.
 */
export function isSilentLine(line: string): boolean {
  if (!line.trim()) return true;
  const record = parseJson(line);
  if (!record) return false;
  return (
    record.isMeta === true ||
    record.isSidechain === true ||
    (typeof record.type === 'string' && SILENT_TYPES.has(record.type))
  );
}

/** Une session lue en plusieurs fois garde ce suivi : un message de l'assistant écrit bloc par bloc répète son usage. */
export class TranscriptParser {
  private readonly countedMessages = new Set<string>();
  /** Appels d'outil qui créent une PR (`gh pr create`), en attente de leur résultat, qui en donne l'adresse */
  private readonly pullRequestCalls = new Set<string>();

  parse(line: string): ParsedLine[] {
    const record = parseJson(line);
    if (!record) return [];
    const sessionId = text(record.sessionId);
    if (!sessionId || record.isSidechain === true) return [];
    // Un message écrit dans Bosco et arrivé par le canal est une demande de la personne, bien que « méta »
    const viaChannel = channelMessageOf(record);
    if (record.isMeta === true && !viaChannel) return [];
    const base = {
      at: date(record.timestamp),
      cwd: text(record.cwd),
      branch: text(record.gitBranch),
      model: null,
      projectRoot: null,
      usage: null,
    };
    switch (record.type) {
      case 'ai-title': {
        const title = text(record.aiTitle);
        return title ? [{ sessionId, event: { ...base, kind: 'title', text: title } }] : [];
      }
      case 'user':
        if (viaChannel) return [{ sessionId, event: { ...base, kind: 'prompt', text: shorten(viaChannel) } }];
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
    // Les résultats d'outils reviennent aussi en lignes « user » : ce ne sont pas des messages de la personne, mais
    // celui d'une création de PR en donne l'adresse
    if (!prompt)
      return this.pullRequests(content).map((url) => ({
        sessionId,
        event: { ...base, kind: 'pullRequest', text: url },
      }));
    return [{ sessionId, event: { ...base, kind: 'prompt', text: shorten(prompt) } }];
  }

  /** Adresses des PR rendues par les appels `gh pr create` dont ce contenu donne le résultat. */
  private pullRequests(content: unknown): string[] {
    if (!Array.isArray(content)) return [];
    return content.filter(isRecord).flatMap((block) => {
      const id = text(block.tool_use_id);
      if (block.type !== 'tool_result' || !id || !this.pullRequestCalls.has(id)) return [];
      this.pullRequestCalls.delete(id);
      const output = typeof block.content === 'string' ? block.content : (textBlocks(block.content) ?? '');
      const url = PULL_REQUEST_URL.exec(output)?.[0];
      return url ? [url] : [];
    });
  }

  private assistantEvents(sessionId: string, base: Base, message: unknown): ParsedLine[] {
    if (!isRecord(message)) return [];
    const model = text(message.model);
    const messageId = text(message.id);
    const usage = messageId && !this.countedMessages.has(messageId) ? tokenUsage(message.usage) : null;
    if (messageId && usage) this.countedMessages.add(messageId);
    const blocks = Array.isArray(message.content) ? message.content.filter(isRecord) : [];
    for (const block of blocks) {
      const id = text(block.id);
      if (block.type === 'tool_use' && id && createsPullRequest(block)) this.pullRequestCalls.add(id);
    }
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

/** Adresse d'une PR GitHub, telle que `gh pr create` l'écrit à la fin de sa sortie. */
const PULL_REQUEST_URL = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/;

/** Un appel de Bash qui lance `gh pr create`, seul ou dans une suite de commandes. */
function createsPullRequest(block: Record<string, unknown>): boolean {
  if (block.name !== 'Bash' || !isRecord(block.input)) return false;
  const command = text(block.input.command);
  return command !== null && /\bgh\s+pr\s+create\b/.test(command);
}

type Base = Pick<TranscriptEvent, 'at' | 'branch' | 'cwd' | 'model' | 'projectRoot' | 'usage'>;

/** Bloc d'un message de l'assistant : son texte, ou l'outil appelé et son argument principal. */
function blockEvent(
  block: Record<string, unknown>,
): Pick<TranscriptEvent, 'change' | 'kind' | 'question' | 'text' | 'usage'>[] {
  const content = text(block.text);
  if (block.type === 'text' && content) return [{ kind: 'reply', text: shorten(content), usage: null }];
  if (block.type === 'tool_use' && text(block.name))
    return [
      {
        kind: 'tool',
        text: toolSummary(block),
        usage: null,
        change: changeOf(String(block.name), block.input),
        question: block.name === 'AskUserQuestion' ? questionOf(block.input) : null,
      },
    ];
  return [];
}

/** Première question d'un AskUserQuestion (« Quel exportateur pour les traces ? »), et le nombre des suivantes. */
function questionOf(input: unknown): null | string {
  if (!isRecord(input) || !Array.isArray(input.questions)) return null;
  const questions = input.questions
    .filter(isRecord)
    .map((entry) => text(entry.question))
    .filter(Boolean);
  const [first] = questions;
  if (!first) return null;
  return questions.length > 1 ? `${first} (+ ${questions.length - 1} autres)` : first;
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
  return describeAction(String(block.name), block.input).summary;
}
