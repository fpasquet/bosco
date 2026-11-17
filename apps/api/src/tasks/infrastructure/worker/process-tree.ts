// Mesure d'un tour piloté (DT-35) : l'agent tourne sur le poste, hors conteneur. On lit dans /proc son processus et ceux
// qu'il a lancés (commandes, serveurs de test) : temps processeur écoulé depuis la dernière lecture et mémoire résidente.
import { readdir, readFile } from 'node:fs/promises';

/** Tops d'horloge par seconde du noyau Linux (USER_HZ), fixe sur les architectures courantes */
const TICKS_PER_SECOND = 100;
const PAGE_SIZE = 4096;

interface ProcessStat {
  parent: number;
  /** Pages de mémoire résidente */
  rss: number;
  /** Temps processeur, en tops, utilisateur et système */
  ticks: number;
}

/** Une ligne de /proc/<pid>/stat ; le nom (2e champ) peut contenir des espaces, d'où la coupe après « ) ». */
export function parseStat(line: string): ProcessStat | null {
  const fields = line.slice(line.lastIndexOf(')') + 2).split(' ');
  // Après le nom : état (3), parent (4), …, utime (14), stime (15), …, rss (24) ; indices décalés de 3
  const parent = Number(fields[1]);
  const ticks = Number(fields[11]) + Number(fields[12]);
  const rss = Number(fields[21]);
  return Number.isFinite(parent) && Number.isFinite(ticks) && Number.isFinite(rss) ? { parent, rss, ticks } : null;
}

async function readAll(): Promise<Map<number, ProcessStat>> {
  const entries = await readdir('/proc').catch(() => [] as string[]);
  const stats = new Map<number, ProcessStat>();
  await Promise.all(
    entries
      .filter((entry) => /^\d+$/.test(entry))
      .map(async (entry) => {
        const line = await readFile(`/proc/${entry}/stat`, 'utf8').catch(() => null);
        const stat = line ? parseStat(line) : null;
        if (stat) stats.set(Number(entry), stat);
      }),
  );
  return stats;
}

/** Le processus et tous ses descendants */
export function treeOf(root: number, stats: ReadonlyMap<number, Pick<ProcessStat, 'parent'>>): number[] {
  const tree = [root];
  for (let index = 0; index < tree.length; index++) {
    for (const [pid, stat] of stats) if (stat.parent === tree[index] && !tree.includes(pid)) tree.push(pid);
  }
  return tree.filter((pid) => stats.has(pid));
}

export class ProcessTreeProbe {
  private readonly previous = new Map<number, { at: number; ticks: number }>();

  /** Processeur en cœurs et mémoire en octets de chaque arbre de processus, par processus racine. */
  async sample(roots: readonly number[]): Promise<Map<number, { cpu: number; memory: number }>> {
    const result = new Map<number, { cpu: number; memory: number }>();
    if (roots.length === 0) {
      this.previous.clear();
      return result;
    }
    const stats = await readAll();
    const now = Date.now();
    for (const root of roots) {
      const tree = treeOf(root, stats);
      const ticks = tree.reduce((sum, pid) => sum + (stats.get(pid)?.ticks ?? 0), 0);
      const memory = tree.reduce((sum, pid) => sum + (stats.get(pid)?.rss ?? 0), 0) * PAGE_SIZE;
      const before = this.previous.get(root);
      const seconds = before ? (now - before.at) / 1000 : 0;
      const cpu = before && seconds > 0 ? Math.max(0, ticks - before.ticks) / TICKS_PER_SECOND / seconds : 0;
      this.previous.set(root, { at: now, ticks });
      result.set(root, { cpu, memory });
    }
    for (const root of this.previous.keys()) if (!roots.includes(root)) this.previous.delete(root);
    return result;
  }
}
