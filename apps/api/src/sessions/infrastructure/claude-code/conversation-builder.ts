import type { ConversationPart, ConversationStep, ConversationTurn } from '../../domain/conversation.ts';
// Conversation d'une session, ligne par ligne de son transcript. Le format est interne à Claude Code et change d'une
// version à l'autre (DT-05) : on ne garde que les demandes, les réflexions, les outils et les réponses, et toute ligne
// inconnue, incomplète ou mal formée est ignorée sans erreur (NF-08).
import { describeAction } from '../../domain/action-summary.ts';
import { type Conversation, lastParts } from '../../domain/conversation.ts';

/** Texte d'une entrée d'outil au-delà duquel il est coupé (le contenu d'un Write, l'ancien texte d'un Edit). */
const INPUT_TEXT_LIMIT = 8000;
/** Résultat d'un outil : on garde son début et sa fin (la sortie d'une commande se lit souvent par la fin). */
const OUTPUT_HEAD = 6000;
const OUTPUT_TAIL = 6000;
const INPUT_DEPTH = 4;
const INPUT_ITEMS = 50;
/** Une réflexion plus longue est un trou dans le transcript (session reprise), pas une durée. */
const REASONING_MAX_SECONDS = 3600;

type ToolStep = Extract<ConversationStep, { kind: 'tool' }>;
type JsonRecord = Record<string, unknown>;

export class ConversationBuilder {
  private readonly turns: ConversationTurn[] = [];
  private readonly openTools = new Map<string, ToolStep>();
  private lastAt: Date | null = null;
  private count = 0;
  private lastModel: null | string = null;

  /**
   * partial : la lecture commence au milieu du transcript, ses premiers échanges manquent. sidechain : le transcript
   * est celui d'un sous-agent, dont toutes les lignes sont marquées comme une branche à part.
   */
  constructor(
    private readonly partial = false,
    private readonly sidechain = false,
  ) {}

  /** Dernier modèle qui a répondu (« claude-sonnet-5-5 »). */
  get model(): null | string {
    return this.lastModel;
  }

  add(line: string): void {
    const record = parseJson(line);
    if (!record || record.isMeta === true || record.isCompactSummary === true) return;
    if ((record.isSidechain === true) !== this.sidechain) return;
    const at = date(record.timestamp);
    if (!at) return;
    const message = isRecord(record.message) ? record.message : null;
    if (record.type === 'user' && message) this.user(message.content, at);
    else if (record.type === 'assistant' && message) {
      if (typeof message.model === 'string' && !message.model.startsWith('<')) this.lastModel = message.model;
      this.assistant(message.content, at);
    } else return;
    this.lastAt = at;
  }

  result(): Conversation {
    const conversation = lastParts(this.turns);
    return { ...conversation, partial: this.partial || conversation.partial };
  }

  /** Ligne « user » : une demande de la personne, ou les résultats des outils appelés juste avant. */
  private user(content: unknown, at: Date): void {
    if (typeof content === 'string') {
      this.prompt(content, at);
      return;
    }
    if (!Array.isArray(content)) return;
    const texts: string[] = [];
    for (const block of content.filter(isRecord)) {
      if (block.type === 'tool_result') this.resolve(block, at);
      else if (block.type === 'text' && typeof block.text === 'string') texts.push(block.text);
      else if (block.type === 'image') texts.push('[image]');
    }
    if (texts.length) this.prompt(texts.join('\n'), at);
  }

  private prompt(raw: string, at: Date): void {
    const text = promptText(raw);
    if (!text) return;
    this.turns.push({ at, id: this.nextId('u'), parts: [{ at, kind: 'text', text }], role: 'user' });
  }

  private assistant(content: unknown, at: Date): void {
    if (!Array.isArray(content)) return;
    for (const block of content.filter(isRecord)) {
      const part = this.partOf(block, at);
      if (part) this.agentTurn(at).parts.push(part);
    }
  }

  private partOf(block: JsonRecord, at: Date): ConversationPart | null {
    if (block.type === 'text' && typeof block.text === 'string' && block.text.trim())
      return { at, kind: 'text', text: block.text };
    if (block.type === 'thinking') {
      // Le modèle peut garder sa réflexion pour lui : il n'en reste qu'une signature, et la ligne sans texte
      const text = typeof block.thinking === 'string' ? block.thinking.trim() : '';
      return { at, kind: 'reasoning', seconds: this.secondsSinceLast(at), text };
    }
    if (block.type === 'tool_use' && typeof block.id === 'string' && typeof block.name === 'string') {
      const input = isRecord(block.input) ? (bounded(block.input, 0) as JsonRecord) : {};
      const step: ToolStep = {
        at,
        endedAt: null,
        error: false,
        id: block.id,
        input,
        kind: 'tool',
        name: block.name,
        output: null,
        summary: describeAction(block.name, block.input).summary,
      };
      this.openTools.set(block.id, step);
      return step;
    }
    return null;
  }

  /** Le tour de l'agent en cours, ou un nouveau tour après une demande de la personne. */
  private agentTurn(at: Date): ConversationTurn {
    const last = this.turns.at(-1);
    if (last?.role === 'assistant') return last;
    const turn: ConversationTurn = { at, id: this.nextId('a'), parts: [], role: 'assistant' };
    this.turns.push(turn);
    return turn;
  }

  private resolve(block: JsonRecord, at: Date): void {
    const id = typeof block.tool_use_id === 'string' ? block.tool_use_id : null;
    const step = id ? this.openTools.get(id) : undefined;
    if (!id || !step) return;
    this.openTools.delete(id);
    step.output = bounds(outputText(block.content));
    step.error = block.is_error === true;
    step.endedAt = at;
  }

  private secondsSinceLast(at: Date): null | number {
    if (!this.lastAt) return null;
    const seconds = Math.round((at.getTime() - this.lastAt.getTime()) / 1000);
    return seconds >= 0 && seconds <= REASONING_MAX_SECONDS ? seconds : null;
  }

  private nextId(prefix: string): string {
    this.count += 1;
    return `${prefix}${this.count}`;
  }
}

/**
 * Texte d'une demande, tel que la personne l'a écrit : sans les rappels ajoutés par Claude Code, et une commande
 * (« /review 12 ») plutôt que ses balises. La sortie d'une commande locale et la notification d'une tâche de fond ne
 * sont pas des demandes.
 */
export function promptText(raw: string): null | string {
  if (raw.includes('<local-command-stdout>') || raw.includes('<local-command-stderr>')) return null;
  // La fin d'une tâche de fond (sous-agent, commande) est une notification de Claude Code, pas une demande
  if (raw.trimStart().startsWith('<task-notification>')) return null;
  const command = /<command-name>([^<]*)<\/command-name>/.exec(raw)?.[1]?.trim();
  if (command) {
    const args = /<command-args>([^<]*)<\/command-args>/.exec(raw)?.[1]?.trim();
    return args ? `${command} ${args}` : command;
  }
  const text = raw.replaceAll(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();
  return text || null;
}

/** Texte du résultat d'un outil : une chaîne, ou ses blocs de texte ; une image n'est que signalée. */
function outputText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter(isRecord)
    .map((block) => {
      if (block.type === 'text' && typeof block.text === 'string') return block.text;
      return block.type === 'image' ? '[image]' : '';
    })
    .filter(Boolean)
    .join('\n');
}

/** Un résultat trop long garde son début et sa fin, avec le nombre de caractères laissés de côté. */
export function bounds(text: string): string {
  if (text.length <= OUTPUT_HEAD + OUTPUT_TAIL) return text;
  const skipped = text.length - OUTPUT_HEAD - OUTPUT_TAIL;
  return `${text.slice(0, OUTPUT_HEAD)}\n… ${skipped} caractères non affichés …\n${text.slice(-OUTPUT_TAIL)}`;
}

/** Entrée d'un outil gardée dans des limites : textes coupés, listes et profondeur bornées. */
function bounded(value: unknown, depth: number): unknown {
  if (typeof value === 'string')
    return value.length > INPUT_TEXT_LIMIT ? `${value.slice(0, INPUT_TEXT_LIMIT)}…` : value;
  if (Array.isArray(value)) return value.slice(0, INPUT_ITEMS).map((item) => bounded(item, depth + 1));
  if (isRecord(value)) {
    if (depth >= INPUT_DEPTH) return '…';
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, bounded(item, depth + 1)]));
  }
  return value;
}

function parseJson(line: string): JsonRecord | null {
  try {
    const value: unknown = JSON.parse(line);
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function date(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
