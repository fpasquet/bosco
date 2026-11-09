// Mise à jour de l'application du poste (CA-APPS-10) : un paquet plus récent installé par-dessus celui qui tourne
// remplace ses fichiers, mais pas le code déjà chargé. L'application le remarque et propose de relancer Bosco.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Version du paquet installé, lue sur le disque (et non celle chargée au lancement). */
export function installedVersion(appDir: string): null | string {
  try {
    const { version } = JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf8')) as { version?: unknown };
    return typeof version === 'string' ? version : null;
  } catch {
    return null;
  }
}

/** Une version installée qui n'est pas celle qui tourne : la mise à jour à proposer, sinon null. */
export function pendingUpdate(running: string, installed: null | string): null | string {
  return installed && installed !== running ? installed : null;
}

/** « 0.1.0+git20261109073400.3118cb5 » → « 0.1.0 · 3118cb5 » : la version et son commit. */
export function displayVersion(version: string): string {
  const [base = version, build = ''] = version.split('+');
  const commit = build.startsWith('git') ? build.split('.')[1] : undefined;
  return commit ? `${base} · ${commit}` : base;
}

export function updateText(version: string): Readonly<{ body: string; title: string }> {
  return {
    title: 'Bosco a été mis à jour',
    body: `La version ${displayVersion(version)} est installée : relance Bosco pour t’en servir.`,
  };
}
