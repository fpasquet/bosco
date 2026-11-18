import { createHash } from 'node:crypto';
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AllowListPublisher } from '../../application/isolation.service.ts';

/** Sous-dossier des domaines propres à chaque projet, à côté de la liste générale. */
export const PROJECTS_DIR = 'projects';

/** Nom du fichier des domaines d'un projet, d'après son chemin : le proxy d'un bac à sable lit ceux de ses projets. */
export function projectAllowFile(path: string): string {
  return `${createHash('sha256').update(path).digest('hex').slice(0, 16)}.json`;
}

/**
 * Liste des domaines autorisés, dans un dossier monté en lecture seule dans le proxy de chaque bac à sable, avec les
 * domaines propres à chaque projet. Chaque fichier est remplacé d'un coup (le proxy ne lit jamais un fichier à moitié
 * écrit) et relu à chaque connexion.
 */
export class AllowListFile implements AllowListPublisher {
  constructor(readonly dir: string) {}

  async publish(domains: readonly string[]): Promise<void> {
    await this.write(this.dir, 'allow.json', domains);
  }

  /** Domaines de chaque projet ; le fichier d'un projet retiré disparaît. */
  async publishProjects(projects: readonly { domains: readonly string[]; path: string }[]): Promise<void> {
    const dir = join(this.dir, PROJECTS_DIR);
    const kept = new Set<string>();
    for (const { domains, path } of projects) {
      const file = projectAllowFile(path);
      kept.add(file);
      await this.write(dir, file, domains);
    }
    const existing = await readdir(dir).catch((): string[] => []);
    for (const file of existing) if (!kept.has(file)) await rm(join(dir, file), { force: true });
  }

  private async write(dir: string, file: string, domains: readonly string[]): Promise<void> {
    await mkdir(dir, { recursive: true });
    const draft = join(dir, `${file}.next`);
    await writeFile(draft, JSON.stringify(domains));
    await rename(draft, join(dir, file));
  }
}
