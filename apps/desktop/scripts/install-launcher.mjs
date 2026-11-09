// `make desktop-install` : un lanceur Bosco dans le menu des applications, qui ouvre l'application du poste du dépôt.
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { electronLaunch } from './electron-args.mjs';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { args, electron, hint } = electronLaunch(app);
const file = join(homedir(), '.local', 'share', 'applications', 'bosco.desktop');
mkdirSync(dirname(file), { recursive: true });
writeFileSync(
  file,
  [
    '[Desktop Entry]',
    'Type=Application',
    'Name=Bosco',
    'Comment=Tes sessions Claude Code, au même endroit',
    `Exec=${[electron, app, ...args].join(' ')}`,
    `Icon=${join(app, 'assets', 'icon-256.png')}`,
    'Terminal=false',
    'Categories=Development;',
    'StartupWMClass=Bosco',
    '',
  ].join('\n'),
);
console.log(`wrote ${file}`);
if (hint) console.log(`Electron runs without its sandbox; to enable it: ${hint}`);
