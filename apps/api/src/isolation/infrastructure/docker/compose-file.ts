// Lecture directe du fichier Compose d'un projet, sans Docker : les scénarios en tirent les services de données que le
// vrai bac à sable démarrerait. Les ancres et les clés de fusion (<<) sont résolues ; les variables ne le sont pas.
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import { COMPOSE_FILES, type ComposeConfig, type DataService, dataServicesOf } from '../../domain/data-services.ts';

export async function readDataServices(projectDir: string): Promise<DataService[]> {
  const name = COMPOSE_FILES.find((candidate) => existsSync(join(projectDir, candidate)));
  if (!name) return [];
  const text = await readFile(join(projectDir, name), 'utf8');
  const config = parse(text, { merge: true }) as ComposeConfig | null;
  return config ? dataServicesOf(config) : [];
}
