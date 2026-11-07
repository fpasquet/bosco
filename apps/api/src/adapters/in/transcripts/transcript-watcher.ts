import { type FSWatcher, watch } from 'chokidar';
// Lecture des transcripts d'un profil : d'abord ceux des derniers jours, puis chaque ajout, à partir de la dernière
// position lue. Bosco ne modifie jamais ces fichiers (RF-SESS-01) ; une ligne incomplète attend la lecture suivante.
import { open, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { SessionService, Source, TranscriptEvent, TranscriptWatcher } from '@bosco/core/sessions';
import type { TranscriptCursorStore } from '../../out/persistence/transcript-cursor.store.ts';
import { TranscriptParser } from '../../out/claude-code/transcript-parser.ts';

export class FileTranscriptWatcher implements TranscriptWatcher {
  private readonly parsers = new Map<string, TranscriptParser>();
  private readonly queues = new Map<string, Promise<void>>();
  private readonly watchers = new Map<string, FSWatcher>();

  constructor(
    private readonly sessionService: SessionService,
    private readonly cursors: TranscriptCursorStore,
  ) {}

  async watch(source: Source, since: Date): Promise<void> {
    if (this.watchers.has(source.id)) return;
    const projects = join(source.path, 'projects');
    const watcher = watch(projects, {
      ignoreInitial: true,
      depth: 1,
      ignored: (path, stats) => Boolean(stats?.isFile() && !path.endsWith('.jsonl')),
    });
    watcher.on('add', (file) => void this.enqueue(source, file));
    watcher.on('change', (file) => void this.enqueue(source, file));
    this.watchers.set(source.id, watcher);
    for (const file of await recentTranscripts(projects, since)) await this.enqueue(source, file);
  }

  async close(): Promise<void> {
    const watchers = [...this.watchers.values()];
    this.watchers.clear();
    await Promise.all(watchers.map((watcher) => watcher.close()));
    await Promise.all(this.queues.values());
  }

  /** Une lecture à la fois par fichier, dans l'ordre des modifications. */
  private enqueue(source: Source, file: string): Promise<void> {
    const previous = this.queues.get(file) ?? Promise.resolve();
    const next = previous
      .then(() => this.readNewLines(source, file))
      .catch((error: unknown) => {
        console.warn(`transcript ${file} skipped: ${error instanceof Error ? error.message : String(error)}`);
      });
    this.queues.set(file, next);
    return next;
  }

  private async readNewLines(source: Source, file: string): Promise<void> {
    const info = await stat(file);
    const stored = await this.cursors.offsetOf(file);
    // Un fichier plus court qu'avant a été réécrit : on le relit depuis le début
    const offset = info.size < stored ? 0 : stored;
    if (info.size === offset) return;
    const handle = await open(file, 'r');
    const buffer = Buffer.alloc(info.size - offset);
    try {
      await handle.read(buffer, 0, buffer.length, offset);
    } finally {
      await handle.close();
    }
    const end = buffer.lastIndexOf(0x0a);
    if (end < 0) return;
    const parser = this.parsers.get(file) ?? new TranscriptParser();
    this.parsers.set(file, parser);
    const bySession = new Map<string, TranscriptEvent[]>();
    for (const line of buffer.subarray(0, end).toString('utf8').split('\n')) {
      for (const { sessionId, event } of parser.parse(line)) {
        bySession.set(sessionId, [...(bySession.get(sessionId) ?? []), event]);
      }
    }
    for (const [sessionId, events] of bySession)
      await this.sessionService.recordTranscript(source.id, sessionId, events);
    await this.cursors.moveTo(file, offset + end + 1);
  }
}

async function recentTranscripts(projects: string, since: Date): Promise<string[]> {
  const repositories = await readdir(projects, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const repository of repositories.filter((entry) => entry.isDirectory())) {
    const names = await readdir(join(projects, repository.name)).catch(() => []);
    for (const name of names.filter((candidate) => candidate.endsWith('.jsonl'))) {
      const file = join(projects, repository.name, name);
      const info = await stat(file);
      if (info.mtime >= since) files.push(file);
    }
  }
  return files;
}
