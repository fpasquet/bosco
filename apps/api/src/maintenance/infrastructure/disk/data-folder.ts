import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { DataFolder } from '../../application/data.service.ts';

/** Le dossier des données de Bosco, mesuré fichier par fichier ; les liens ne sont pas suivis. */
export class DiskDataFolder implements DataFolder {
  constructor(readonly path: string) {}

  size(): Promise<number> {
    return sizeOf(this.path);
  }
}

async function sizeOf(path: string): Promise<number> {
  const info = await lstat(path).catch(() => null);
  if (!info) return 0;
  if (!info.isDirectory()) return info.isFile() ? info.size : 0;
  const entries = await readdir(path).catch(() => []);
  let total = 0;
  for (const entry of entries) {
    const size = await sizeOf(join(path, entry));
    total += size;
  }
  return total;
}
