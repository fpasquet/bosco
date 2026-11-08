import { mkdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AllowListPublisher } from '../../application/isolation.service.ts';

/**
 * Liste des domaines autorisés, dans un dossier monté en lecture seule dans le proxy de chaque tâche. Remplacée
 * d'un coup (le proxy ne lit jamais un fichier à moitié écrit) et relue à chaque connexion.
 */
export class AllowListFile implements AllowListPublisher {
  constructor(readonly dir: string) {}

  async publish(domains: readonly string[]): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const draft = join(this.dir, 'allow.json.next');
    await writeFile(draft, JSON.stringify(domains));
    await rename(draft, join(this.dir, 'allow.json'));
  }
}
