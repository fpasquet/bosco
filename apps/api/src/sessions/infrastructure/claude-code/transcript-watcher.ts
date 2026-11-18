import { type FSWatcher, watch } from 'chokidar';
// Lecture des transcripts d'un profil : d'abord ceux des derniers jours, puis chaque ajout, à partir de la dernière
// position lue. Bosco ne modifie jamais ces fichiers ; une ligne incomplète attend la lecture suivante.
import { open, readdir, stat } from 'node:fs/promises';
import { basename, dirname, join, relative, sep } from 'node:path';
import type { TranscriptWatcher } from '../../application/ports.ts';
import type { SessionService } from '../../application/session.service.ts';
import type { Source } from '../../domain/source.ts';
import type { TranscriptEvent } from '../../domain/transcript-event.ts';
import type { ImportProgress } from '../events/session-events.bus.ts';
import type { TranscriptCursorStore } from '../persistence/transcript-cursor.store.ts';
import { judgeTranscript, TranscriptFormats, type TranscriptReading } from '../../domain/transcript-format.ts';
import { isSilentLine, TranscriptParser } from './transcript-parser.ts';

export class FileTranscriptWatcher implements TranscriptWatcher {
  private readonly gitRoots = new Map<string, Promise<null | string>>();
  private readonly parsers = new Map<string, TranscriptParser>();
  private readonly queues = new Map<string, Promise<void>>();
  private readonly watchers = new Map<string, FSWatcher>();
  /** Ce qu'a donné chaque transcript pas encore jugé ; null une fois jugé */
  private readonly readings = new Map<string, null | TranscriptReading>();
  private readonly formats = new TranscriptFormats();

  constructor(
    private readonly sessionService: SessionService,
    private readonly cursors: TranscriptCursorStore,
    /** Avancement de la première lecture, pour le bandeau de chargement ; null quand elle est finie */
    private readonly reportProgress: (progress: ImportProgress | null) => void = () => undefined,
  ) {}

  async watch(source: Source, since: Date): Promise<void> {
    if (this.watchers.has(source.id)) return;
    const projects = join(source.path, 'projects');
    const watcher = watch(projects, {
      ignoreInitial: true,
      // <dossier>/<session>.jsonl, et <dossier>/<session>/subagents/agent-<id>.jsonl pour les sous-agents
      depth: 3,
      ignored: (path, stats) => !isTranscriptPath(relative(projects, path), stats?.isFile()),
    });
    watcher.on('add', (file) => void this.enqueue(source, file));
    watcher.on('change', (file) => void this.enqueue(source, file));
    this.watchers.set(source.id, watcher);
    await this.readSince(source, since);
  }

  /**
   * Lit les transcripts du profil modifiés depuis cette date. Chaque fichier reprend à sa dernière position : un
   * transcript déjà lu n'est pas relu, seuls les plus anciens s'ajoutent quand la période s'allonge.
   */
  async readSince(source: Source, since: Date): Promise<void> {
    const projects = join(source.path, 'projects');
    const recent = (list: { mtime: number; path: string }[]) =>
      // Les sessions récentes d'abord : les sessions ouvertes s'affichent avant l'historique
      list.filter(({ mtime }) => mtime >= since.getTime()).toSorted((a, b) => b.mtime - a.mtime);
    const sessionFiles = await listTranscripts(projects);
    const sessions = recent(sessionFiles);
    for (const [index, file] of sessions.entries()) {
      this.reportProgress({ read: index, total: sessions.length });
      await this.enqueue(source, file.path);
    }
    // Les sous-agents après les sessions, dont ils ne sont qu'une part de l'usage : le bandeau compte les sessions
    const subagentFiles = await listSubagentTranscripts(projects);
    const subagents = recent(subagentFiles);
    if (subagents.length > 0) this.reportProgress({ read: sessions.length, total: sessions.length });
    for (const file of subagents) await this.enqueue(source, file.path);
    this.reportProgress(null);
  }

  /** Transcripts du profil modifiés avant cette date et jamais lus : ce que « Tout l'historique » ajouterait. */
  async countUnread(source: Source, before: Date): Promise<number> {
    const files = await listTranscripts(join(source.path, 'projects'));
    let count = 0;
    for (const file of files.filter(({ mtime }) => mtime < before.getTime())) {
      const offset = await this.cursors.offsetOf(file.path);
      if (offset === 0) count += 1;
    }
    return count;
  }

  /** Bosco ne sait plus lire le format des nouvelles sessions de la source : elle est « À mettre à jour ». */
  isOutdated(sourceId: string): boolean {
    return this.formats.isOutdated(sourceId);
  }

  async unwatch(sourceId: string): Promise<void> {
    const watcher = this.watchers.get(sourceId);
    this.watchers.delete(sourceId);
    await watcher?.close();
  }

  /** Source retirée : sa lecture s'arrête et ce qui en était gardé en mémoire s'oublie ; ses fichiers restent. */
  async forget(source: Source): Promise<void> {
    await this.unwatch(source.id);
    const prefix = `${join(source.path, 'projects')}/`;
    const pending = [...this.queues.entries()].filter(([file]) => file.startsWith(prefix));
    await Promise.all(pending.map(([, queue]) => queue));
    for (const [file] of pending) this.queues.delete(file);
    for (const file of [...this.parsers.keys()]) if (file.startsWith(prefix)) this.parsers.delete(file);
    for (const file of [...this.readings.keys()]) if (file.startsWith(prefix)) this.readings.delete(file);
    this.formats.forget(source.id);
  }

  async close(): Promise<void> {
    const watchers = [...this.watchers.values()];
    this.watchers.clear();
    await Promise.all(watchers.map((watcher) => watcher.close()));
    await Promise.all(this.queues.values());
    this.queues.clear();
    this.parsers.clear();
    this.readings.clear();
    this.formats.forget();
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

  /** Racine git d'un dossier de travail (le dossier qui contient .git), cherchée une fois par dossier. */
  private gitRootOf(cwd: string): Promise<null | string> {
    const known = this.gitRoots.get(cwd);
    if (known) return known;
    const found = findGitRoot(cwd);
    this.gitRoots.set(cwd, found);
    return found;
  }

  private async readNewLines(source: Source, file: string): Promise<void> {
    const stored = await this.cursors.offsetOf(file);
    // Format illisible : les nouvelles sessions de la source ne se lisent plus, celles déjà commencées si
    if (stored === 0 && this.formats.isOutdated(source.id)) return;
    const info = await stat(file);
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
    const { bySession, reading } = await this.parseLines(parser, buffer.subarray(0, end).toString('utf8'));
    // Le format se juge sur les transcripts des sessions ; un sous-agent n'en donne que l'usage
    if (!isSubagentTranscript(file)) this.judge(source, file, reading);
    for (const [sessionId, events] of bySession)
      await this.sessionService.recordTranscript(source.id, sessionId, events);
    await this.cursors.moveTo(file, offset + end + 1);
  }

  /** Les faits des lignes lues, session par session, et ce que la lecture en a tiré. */
  private async parseLines(
    parser: TranscriptParser,
    text: string,
  ): Promise<{ bySession: Map<string, TranscriptEvent[]>; reading: TranscriptReading }> {
    const bySession = new Map<string, TranscriptEvent[]>();
    const reading = { lines: 0, read: 0 };
    for (const line of text.split('\n')) {
      const parsed = parser.parse(line);
      // Une ligne connue sans fait à lire ne compte pas pour juger le format
      reading.lines += parsed.length > 0 || !isSilentLine(line) ? 1 : 0;
      reading.read += parsed.length > 0 ? 1 : 0;
      for (const { sessionId, event } of parsed) {
        const projectRoot = event.cwd ? await this.gitRootOf(event.cwd) : null;
        bySession.set(sessionId, [...(bySession.get(sessionId) ?? []), { ...event, projectRoot }]);
      }
    }
    return { bySession, reading };
  }

  /**
   * Juge un nouveau transcript sur ses premières lignes, lues en une ou plusieurs fois : une fois lisible ou illisible,
   * il compte pour sa source, puis n'est plus jugé.
   */
  private judge(source: Source, file: string, reading: TranscriptReading): void {
    const known = this.readings.get(file);
    if (known === null) return;
    const total = { lines: (known?.lines ?? 0) + reading.lines, read: (known?.read ?? 0) + reading.read };
    const judgement = judgeTranscript(total);
    if (judgement === 'unknown') {
      this.readings.set(file, total);
      return;
    }
    this.readings.set(file, null);
    this.formats.note(source.id, judgement);
  }
}

async function findGitRoot(cwd: string): Promise<null | string> {
  for (let dir = cwd; dir !== dirname(dir); dir = dirname(dir)) {
    const marker = await stat(join(dir, '.git')).catch(() => null);
    if (marker) return dir;
  }
  return null;
}

/** Transcripts d'un profil, un par session, avec leur date de modification. */
async function listTranscripts(projects: string): Promise<{ mtime: number; path: string }[]> {
  const folders = await readdir(projects, { withFileTypes: true }).catch(() => []);
  const files: { mtime: number; path: string }[] = [];
  for (const folder of folders.filter((entry) => entry.isDirectory())) {
    const names = await readdir(join(projects, folder.name)).catch(() => []);
    for (const name of names.filter((candidate) => candidate.endsWith('.jsonl'))) {
      const file = join(projects, folder.name, name);
      const info = await stat(file).catch(() => null);
      if (info) files.push({ path: file, mtime: info.mtimeMs });
    }
  }
  return files;
}

/** Transcripts des sous-agents des sessions d'un profil : <dossier>/<session>/subagents/agent-<id>.jsonl. */
async function listSubagentTranscripts(projects: string): Promise<{ mtime: number; path: string }[]> {
  const folders = await readdir(projects, { withFileTypes: true }).catch(() => []);
  const files: { mtime: number; path: string }[] = [];
  for (const folder of folders.filter((entry) => entry.isDirectory())) {
    const sessions = await readdir(join(projects, folder.name), { withFileTypes: true }).catch(() => []);
    for (const session of sessions.filter((entry) => entry.isDirectory())) {
      const dir = join(projects, folder.name, session.name, SUBAGENTS);
      const names = await readdir(dir).catch(() => []);
      for (const name of names.filter(isSubagentFile)) {
        const info = await stat(join(dir, name)).catch(() => null);
        if (info) files.push({ path: join(dir, name), mtime: info.mtimeMs });
      }
    }
  }
  return files;
}

const SUBAGENTS = 'subagents';

function isSubagentFile(name: string): boolean {
  return name.startsWith('agent-') && name.endsWith('.jsonl');
}

/** Fichier d'un sous-agent : …/<session>/subagents/agent-<id>.jsonl. */
export function isSubagentTranscript(file: string): boolean {
  return basename(dirname(file)) === SUBAGENTS && isSubagentFile(basename(file));
}

/**
 * Chemin, relatif au dossier projects d'un profil, que la surveillance suit : les dossiers des projets, les
 * transcripts des sessions, et le chemin jusqu'aux transcripts des sous-agents ; rien d'autre (résultats d'outils…).
 * `file` : undefined quand la nature du chemin n'est pas encore connue.
 */
export function isTranscriptPath(path: string, file: boolean | undefined): boolean {
  if (path === '') return true;
  const parts = path.split(sep);
  switch (parts.length) {
    case 1:
    case 2:
      return file !== true || path.endsWith('.jsonl');
    case 3:
      return parts[2] === SUBAGENTS && file !== true;
    case 4:
      return parts[2] === SUBAGENTS && file !== false && isSubagentFile(parts[3] ?? '');
    default:
      return false;
  }
}
