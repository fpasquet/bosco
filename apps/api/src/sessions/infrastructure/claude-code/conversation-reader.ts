// Conversation d'une session, lue dans son transcript à la demande du fil (E2a). Bosco ne modifie jamais le fichier
// (RF-SESS-01). Une longue session n'est lue que par sa fin, et chaque lecture suivante ne lit que les lignes ajoutées.
import { open, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import type { ConversationReader } from '../../application/ports.ts';
import type { Conversation } from '../../domain/conversation.ts';
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
    const size = file
      ? await stat(file).then(
          (info) => info.size,
          () => null,
        )
      : null;
    if (!file || size === null) {
      this.files.delete(sessionId);
      return null;
    }
    let entry = this.entries.get(file);
    // Un fichier plus court qu'à la dernière lecture a été réécrit : on repart de zéro
    if (!entry || size < entry.offset) entry = this.fresh(size);
    if (size > entry.offset) await readLines(file, entry, size);
    this.entries.delete(file);
    this.entries.set(file, entry);
    for (const old of [...this.entries.keys()].slice(0, Math.max(0, this.entries.size - CACHED)))
      this.entries.delete(old);
    return entry.builder.result();
  }

  private fresh(size: number): Entry {
    const offset = Math.max(0, size - this.tailBytes);
    return {
      builder: new ConversationBuilder(offset > 0),
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
