#!/usr/bin/env node
import { Command } from 'commander';
// Commande bosco : `bosco start` lance le service au premier plan, `bosco service install` l'installe pour l'utilisateur,
// `bosco resume <session>` reprend dans un terminal la session d'un agent du worker.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_NAME } from '@bosco/domain';
import { loadConfig } from '../config.ts';
import { findSession, installSession } from './resume.ts';
import { serviceUnit } from './service-unit.ts';

const command = APP_NAME.toLowerCase();
const program = new Command(command).description(`${APP_NAME}: local control room for Claude Code sessions`);

program
  .command('start')
  .description('Start the service and open the overview')
  .option('--port <port>', 'port to listen on, loopback only')
  .option('--no-open', 'do not open the browser')
  .action((options: { open: boolean; port?: string }) => {
    // Le service est le point d'entrée voisin de la même application (dist/main.js)
    const api = fileURLToPath(new URL('../main.js', import.meta.url));
    const env = { ...process.env, ...(options.port ? { BOSCO_PORT: options.port } : {}) };
    const child = spawn(process.execPath, [api], { env, stdio: ['ignore', 'pipe', 'inherit'] });
    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      process.stdout.write(text);
      const url = /listening on (\S+)/.exec(text)?.[1];
      // Chemin absolu : le PATH du service systemd peut différer de celui de la session
      if (url && options.open) spawn('/usr/bin/xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
    });
    for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => child.kill(signal));
    child.on('exit', (code) => process.exit(code ?? 0));
  });

program
  .command('service')
  .description('Manage the systemd user service')
  .command('install')
  .description('Write the unit file and print how to enable it')
  .action(() => {
    const dir = join(homedir(), '.config', 'systemd', 'user');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${command}.service`);
    writeFileSync(file, serviceUnit({ node: process.execPath, cli: fileURLToPath(import.meta.url), name: APP_NAME }));
    console.log(
      `wrote ${file}\nenable it with: systemctl --user daemon-reload && systemctl --user enable --now ${command}`,
    );
  });

program
  .command('resume')
  .description('Resume a session of a worker agent in this terminal')
  .argument('<session>', 'session id')
  .option('--profile <dir>', 'Claude Code profile to resume in', join(homedir(), '.claude'))
  .action(async (session: string, options: { profile: string }) => {
    const config = loadConfig();
    const worker = join(config.dataDir, 'worker');
    const found = await findSession(worker, session);
    if (!found) {
      console.error(`no session ${session} in ${worker}`);
      process.exit(1);
    }
    const cwd = await installSession(found, options.profile, session);
    const env = { ...process.env, CLAUDE_CONFIG_DIR: options.profile };
    // Claude Code du poste, par son chemin : celui des sessions, sans dépendre du PATH
    const child = spawn(config.worker.claudeBinary, ['--resume', session], { cwd, env, stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code ?? 0));
  });

await program.parseAsync();
