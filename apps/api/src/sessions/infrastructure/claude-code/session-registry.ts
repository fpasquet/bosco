// Registre des sessions ouvertes de Claude Code : un fichier <profil>/sessions/<pid>.json par session vivante (pid,
// sessionId), retiré à la fermeture. Non documenté, constaté sur Claude Code 2.1.319 : à revérifier à chaque version.
// Un profil sans ce dossier garde l'état déduit de l'activité ; le fichier d'un processus mort ne compte pas.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SessionRegistry } from '../../application/ports.ts';
import type { Source } from '../../domain/source.ts';

const POLL_MS = 2000;

/** undefined : un fichier en cours d'écriture, on garde la lecture précédente ; null : pas de registre. */
type Reading = null | ReadonlySet<string> | undefined;

export function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM : le processus existe mais appartient à un autre utilisateur
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

async function readRegistry(dir: string, isAlive: (pid: number) => boolean): Promise<Reading> {
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return null;
  }
  const open = new Set<string>();
  for (const name of names.filter((file) => file.endsWith('.json'))) {
    let entry: { pid?: unknown; sessionId?: unknown };
    try {
      const content = await readFile(join(dir, name), 'utf8');
      entry = JSON.parse(content) as typeof entry;
    } catch {
      return undefined;
    }
    if (typeof entry.sessionId === 'string' && typeof entry.pid === 'number' && isAlive(entry.pid))
      open.add(entry.sessionId);
  }
  return open;
}

/** Sessions entrées ou sorties d'une lecture à l'autre. */
function changesBetween(previous: null | ReadonlySet<string>, next: null | ReadonlySet<string>): string[] {
  const before = previous ?? new Set<string>();
  const after = next ?? new Set<string>();
  return [...new Set([...before, ...after])].filter((id) => before.has(id) !== after.has(id));
}

export class FileSessionRegistry implements SessionRegistry {
  private readonly open = new Map<string, null | ReadonlySet<string>>();
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly isAlive: (pid: number) => boolean = processIsAlive,
    private readonly pollMs = POLL_MS,
  ) {}

  isOpen(sourceId: string, sessionId: string): boolean | null {
    const open = this.open.get(sourceId);
    return open ? open.has(sessionId) : null;
  }

  async watch(source: Source, changed: (sessionIds: string[]) => void): Promise<void> {
    if (this.timers.has(source.id)) return;
    const dir = join(source.path, 'sessions');
    let reading = false;
    const read = async () => {
      // Une lecture à la fois : une lecture lente ne doit pas écraser une plus récente
      if (reading) return;
      reading = true;
      const next = await readRegistry(dir, this.isAlive).finally(() => {
        reading = false;
      });
      if (next === undefined) return;
      const previous = this.open.get(source.id) ?? null;
      this.open.set(source.id, next);
      const ids = changesBetween(previous, next);
      if (ids.length > 0) changed(ids);
    };
    await read();
    // Relu régulièrement : un processus arrêté sans retirer son fichier se voit aussi
    const timer = setInterval(() => void read(), this.pollMs);
    timer.unref();
    this.timers.set(source.id, timer);
  }

  unwatch(sourceId: string): void {
    clearInterval(this.timers.get(sourceId));
    this.timers.delete(sourceId);
    this.open.delete(sourceId);
  }

  close(): void {
    for (const timer of this.timers.values()) clearInterval(timer);
    this.timers.clear();
  }
}
