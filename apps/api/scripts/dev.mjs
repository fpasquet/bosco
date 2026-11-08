// pnpm dev : recompile l'API à chaque modification, relance le service, et sert l'interface en mode développement.
// Port et données à part (4880, .data/ à la racine du dépôt) : un Bosco installé sur le poste continue de tourner.
import { spawn, spawnSync } from 'node:child_process';
import { rmSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Compilation incrémentale : au démarrage du mode watch, rien n'est réécrit, donc le service ne redémarre pas pour rien
const INCREMENTAL = ['--incremental', '--tsBuildInfoFile', 'dist/.tsbuildinfo'];
const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
const env = {
  ...process.env,
  BOSCO_DEV: '1',
  BOSCO_PORT: process.env.BOSCO_PORT ?? '4880',
  BOSCO_DATA_DIR: process.env.BOSCO_DATA_DIR ?? fileURLToPath(new URL('../../../.data', import.meta.url)),
};

// Cache de Next.js en développement : après un changement de dépendances, il sert des pages qui ne s'animent plus.
// Il est vidé quand le fichier de verrouillage est plus récent que lui.
const nextCache = fileURLToPath(new URL('../../web/.next/dev', import.meta.url));
const lockfile = fileURLToPath(new URL('../../../pnpm-lock.yaml', import.meta.url));
const modified = (path) => {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return null;
  }
};
const cacheTime = modified(nextCache);
if (cacheTime !== null && (modified(lockfile) ?? 0) > cacheTime) rmSync(nextCache, { recursive: true, force: true });

// Première compilation avant de démarrer, pour que le service parte d'un dist/ à jour
const first = spawnSync(process.execPath, [tsc, '-p', 'tsconfig.build.json', ...INCREMENTAL], { stdio: 'inherit' });
if (first.status !== 0) process.exit(first.status ?? 1);

const children = [
  spawn(process.execPath, [tsc, '-p', 'tsconfig.build.json', ...INCREMENTAL, '--watch', '--preserveWatchOutput'], {
    stdio: 'inherit',
  }),
  spawn(process.execPath, ['--watch-path=dist', '--watch-preserve-output', 'dist/main.js'], { stdio: 'inherit', env }),
];
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    for (const child of children) child.kill(signal);
    process.exit(0);
  });
}
