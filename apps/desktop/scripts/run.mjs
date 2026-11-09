// `make desktop` : lance l'application du poste depuis le dépôt (le service et l'interface doivent être construits).
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { electronLaunch } from './electron-args.mjs';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { args, electron, hint } = electronLaunch(app);
if (hint) console.log(`Electron sans bac à sable ; pour l'activer : ${hint}`);
const child = spawn(electron, [app, ...args, ...process.argv.slice(2)], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
