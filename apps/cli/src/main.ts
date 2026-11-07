#!/usr/bin/env node
import { Command } from 'commander';
// Commande bosco : `bosco start` lance le service au premier plan, `bosco service install` l'installe pour l'utilisateur.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_NAME } from '@bosco/core/shared';
import { serviceUnit } from './service-unit.ts';

const command = APP_NAME.toLowerCase();
const program = new Command(command).description(`${APP_NAME}: local control room for Claude Code sessions`);

program
  .command('start')
  .description('Start the service and open the overview')
  .option('--port <port>', 'port to listen on, loopback only')
  .option('--no-open', 'do not open the browser')
  .action((options: { open: boolean; port?: string }) => {
    const api = fileURLToPath(import.meta.resolve('@bosco/api'));
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

await program.parseAsync();
