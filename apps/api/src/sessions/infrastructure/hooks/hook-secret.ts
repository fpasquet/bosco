// Secret propre à l'installation, exigé par l'entrée des hooks : il est écrit dans les réglages des profils suivis et
// gardé dans le dossier de données de Bosco, lisible par la seule personne du poste.
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadHookSecret(dataDir: string): string {
  const path = join(dataDir, 'hooks.secret');
  try {
    const secret = readFileSync(path, 'utf8').trim();
    if (secret) return secret;
  } catch {
    // premier démarrage : le secret est créé ci-dessous
  }
  const secret = randomBytes(32).toString('hex');
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(path, `${secret}\n`, { mode: 0o600 });
  return secret;
}
