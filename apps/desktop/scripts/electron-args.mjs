// Arguments de lancement d'Electron : son bac à sable exige que chrome-sandbox appartienne à root avec le bit SUID.
// Sans cela (cas d'une installation par pnpm), l'application se lance sans bac à sable : elle ne charge que l'interface
// locale de Bosco, les liens externes s'ouvrant dans le navigateur. La commande qui le configure est donnée.
import { statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

export function electronLaunch(app) {
  const electron = createRequire(join(app, 'package.json'))('electron');
  const sandbox = join(dirname(electron), 'chrome-sandbox');
  let configured;
  try {
    const stat = statSync(sandbox);
    configured = stat.uid === 0 && (stat.mode & 0o4000) !== 0;
  } catch {
    configured = false;
  }
  return {
    electron,
    args: configured ? [] : ['--no-sandbox'],
    hint: configured ? null : `sudo chown root:root ${sandbox} && sudo chmod 4755 ${sandbox}`,
  };
}
