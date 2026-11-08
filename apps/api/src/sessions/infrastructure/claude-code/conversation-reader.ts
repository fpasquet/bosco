// Conversation d'une session, lue dans son transcript à la demande du fil (E2a). Bosco ne modifie jamais le fichier
// (RF-SESS-01). Une longue session n'est lue que par sa fin, et chaque lecture suivante ne lit que les lignes ajoutées.
import { open, readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import type { ConversationReader } from '../../application/ports.ts';
import type { Conversation, ConversationPart, Subagent } from '../../domain/conversation.ts';
import { lastParts } from '../../domain/conversation.ts';
import { ConversationBuilder } from './conversation-builder.ts';

/** Fin du transcript lue à la première demande : au-delà, le début de la session n'est pas rendu. */
const TAIL_BYTES = 8 * 1024 * 1024;
const CHUNK_BYTES = 1024 * 1024;
/** Conversations gardées en mémoire, les plus récemment lues. */
const CACHED = 8;

interface Entry {
  builder: ConversationBuilder;
  decoder: StringDecoder;
  offset: number;
  /** Ligne commencée, complétée par la lecture suivante */
  rest: string;
  /** La lecture commence au milieu d'une ligne, à ignorer */
  skipFirst: boolean;
}

/** Ce que Claude Code note d'un sous-agent, à côté de son transcript (agent-<id>.meta.json). */
interface SubagentMeta {
  agentType: null | string;
  description: null | string;
  file: string;
  finished: boolean;
  model: null | string;
  toolUseId: string;
}

/** Profondeur des sous-agents lus : un sous-agent peut en lancer un autre, rarement plus. */
const SUBAGENT_DEPTH = 2;
/** Parties d'un sous-agent rendues au plus. */
const SUBAGENT_PARTS = 300;

export class FileConversationReader implements ConversationReader {
  private readonly entries = new Map<string, Entry>();
  private readonly files = new Map<string, string>();
  private readonly queues = new Map<string, Promise<Conversation | null>>();

  constructor(private readonly tailBytes = TAIL_BYTES) {}

  read(profile: string, sessionId: string): Promise<Conversation | null> {
    // Une lecture à la fois par session : deux demandes rapprochées ne lisent pas deux fois les mêmes lignes
    const previous = this.queues.get(sessionId) ?? Promise.resolve(null);
    const next = previous.catch(() => null).then(() => this.readNow(profile, sessionId));
    this.queues.set(sessionId, next);
    return next;
  }

  private async readNow(profile: string, sessionId: string): Promise<Conversation | null> {
    const file = await this.locate(profile, sessionId);
    const builder = file ? await this.builderOf(file, false) : null;
    if (!file || !builder) {
      this.files.delete(sessionId);
      return null;
    }
    // Les sous-agents de la session : <dossier du projet>/<session>/subagents/agent-<id>.{jsonl,meta.json}
    const metas = await subagentMetas(join(dirname(file), sessionId, 'subagents'));
    const conversation = builder.result();
    const turns = await Promise.all(
      conversation.turns.map(async (turn) => ({ ...turn, parts: await this.withSubagents(turn.parts, metas, 1) })),
    );
    return { ...conversation, turns };
  }

  /** Les appels qui ont lancé un sous-agent reçoivent sa consigne, ses étapes et son résultat. */
  private async withSubagents(
    parts: ConversationPart[],
    metas: Map<string, SubagentMeta>,
    depth: number,
  ): Promise<ConversationPart[]> {
    if (metas.size === 0 || depth > SUBAGENT_DEPTH) return parts;
    return Promise.all(
      parts.map(async (part) => {
        const meta = part.kind === 'tool' ? metas.get(part.id) : undefined;
        if (part.kind !== 'tool' || !meta) return part;
        const subagent = await this.subagentOf(meta, metas, depth);
        return subagent ? { ...part, subagent } : part;
      }),
    );
  }

  private async subagentOf(
    meta: SubagentMeta,
    metas: Map<string, SubagentMeta>,
    depth: number,
  ): Promise<null | Subagent> {
    const builder = await this.builderOf(meta.file, true);
    if (!builder) return null;
    const { partial, turns } = lastParts(builder.result().turns, SUBAGENT_PARTS);
    const prompt = turns.find((turn) => turn.role === 'user')?.parts.find((part) => part.kind === 'text');
    const work = turns.filter((turn) => turn.role === 'assistant').flatMap((turn) => turn.parts);
    const parts = await this.withSubagents(work, metas, depth + 1);
    const last = parts.at(-1);
    const lastText = parts.findLast((part) => part.kind === 'text');
    return {
      agentType: meta.agentType,
      description: meta.description,
      endedAt: meta.finished && last ? endOf(last) : null,
      finished: meta.finished,
      model: builder.model ?? meta.model,
      parts,
      partial,
      prompt: prompt?.kind === 'text' ? prompt.text : null,
      result: meta.finished && lastText?.kind === 'text' ? lastText.text : null,
      startedAt: turns[0]?.at ?? null,
    };
  }

  /** Constructeur à jour d'un transcript : seules les lignes ajoutées depuis la dernière lecture sont lues. */
  private async builderOf(file: string, sidechain: boolean): Promise<ConversationBuilder | null> {
    const size = await stat(file).then(
      (info) => info.size,
      () => null,
    );
    if (size === null) return null;
    let entry = this.entries.get(file);
    // Un fichier plus court qu'à la dernière lecture a été réécrit : on repart de zéro
    if (!entry || size < entry.offset) entry = this.fresh(size, sidechain);
    if (size > entry.offset) await readLines(file, entry, size);
    this.entries.delete(file);
    this.entries.set(file, entry);
    for (const old of [...this.entries.keys()].slice(0, Math.max(0, this.entries.size - CACHED)))
      this.entries.delete(old);
    return entry.builder;
  }

  private fresh(size: number, sidechain: boolean): Entry {
    const offset = Math.max(0, size - this.tailBytes);
    return {
      builder: new ConversationBuilder(offset > 0, sidechain),
      decoder: new StringDecoder('utf8'),
      offset,
      rest: '',
      skipFirst: offset > 0,
    };
  }

  /** Transcript de la session : <profil>/projects/<dossier du projet>/<session>.jsonl. */
  private async locate(profile: string, sessionId: string): Promise<null | string> {
    const known = this.files.get(sessionId);
    if (known) return known;
    const projects = join(profile, 'projects');
    const folders = await readdir(projects, { withFileTypes: true }).catch(() => []);
    for (const folder of folders.filter((entry) => entry.isDirectory())) {
      const file = join(projects, folder.name, `${sessionId}.jsonl`);
      const found = await stat(file).then(
        (info) => info.isFile(),
        () => false,
      );
      if (found) {
        this.files.set(sessionId, file);
        return file;
      }
    }
    return null;
  }
}

/** Fin d'une partie : celle d'un outil quand il a rendu son résultat, sinon son début. */
function endOf(part: ConversationPart): Date {
  return part.kind === 'tool' ? (part.endedAt ?? part.at) : part.at;
}

/** Les sous-agents d'une session, par l'appel d'outil qui les a lancés ; un fichier illisible est ignoré. */
async function subagentMetas(folder: string): Promise<Map<string, SubagentMeta>> {
  const names = await readdir(folder).catch(() => [] as string[]);
  const metas = await Promise.all(
    names
      .filter((name) => name.endsWith('.meta.json'))
      .map(async (name) => {
        const raw = await readFile(join(folder, name), 'utf8').catch(() => null);
        return raw ? metaOf(raw, join(folder, name.replace(/\.meta\.json$/, '.jsonl'))) : null;
      }),
  );
  return new Map(metas.flatMap((meta) => (meta ? [[meta.toolUseId, meta] as const] : [])));
}

function metaOf(raw: string, file: string): null | SubagentMeta {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const meta = value as Record<string, unknown>;
    const text = (key: string) => (typeof meta[key] === 'string' ? meta[key] : null);
    const toolUseId = text('toolUseId');
    if (!toolUseId) return null;
    return {
      agentType: text('agentType'),
      description: text('description'),
      file,
      finished: meta.finished === true,
      model: text('model'),
      toolUseId,
    };
  } catch {
    return null;
  }
}

/** Lit le fichier de `entry.offset` à `size` et passe chaque ligne complète au constructeur. */
async function readLines(file: string, entry: Entry, size: number): Promise<void> {
  const handle = await open(file, 'r');
  try {
    const buffer = Buffer.alloc(CHUNK_BYTES);
    while (entry.offset < size) {
      const { bytesRead } = await handle.read(buffer, 0, Math.min(CHUNK_BYTES, size - entry.offset), entry.offset);
      if (bytesRead === 0) break;
      entry.offset += bytesRead;
      const lines = (entry.rest + entry.decoder.write(buffer.subarray(0, bytesRead))).split('\n');
      entry.rest = lines.pop() ?? '';
      for (const line of lines) {
        if (entry.skipFirst) {
          entry.skipFirst = false;
          continue;
        }
        if (line.trim()) entry.builder.add(line);
      }
    }
  } finally {
    await handle.close();
  }
}
