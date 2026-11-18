import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ChangelogSource } from '../../application/ports.ts';

/** CHANGELOG.md de la version qui tourne, à la racine du dépôt ou du service installé ; absent, un journal vide. */
export class ChangelogFile implements ChangelogSource {
  constructor(private readonly appRoot: string) {}

  read(): Promise<string> {
    return readFile(join(this.appRoot, 'CHANGELOG.md'), 'utf8').catch(() => '');
  }
}
