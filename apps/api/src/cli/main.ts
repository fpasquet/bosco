#!/usr/bin/env node
import { Command } from 'commander';
// Commande bosco : `bosco start` lance le service au premier plan, `bosco service install` l'installe pour l'utilisateur.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_NAME } from '@bosco/domain';
import { loadConfig } from '../config.ts';
import { ClaudeMcpServerInstaller, MCP_SERVER } from '../sessions/infrastructure/claude-code/mcp-server-installer.ts';
import { loadHookSecret } from '../sessions/infrastructure/hooks/hook-secret.ts';
import { runChannel } from './channel.ts';
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
  .command('channel')
  .description('Bosco channel of a terminal session, launched by Claude Code (do not run it yourself)')
  .action(() => {
    const config = loadConfig();
    // Claude Code donne au serveur du canal l'identifiant de la session qui le lance
    runChannel({
      port: config.port,
      secret: loadHookSecret(config.dataDir),
      sessionId: process.env.CLAUDE_CODE_SESSION_ID ?? null,
    });
  });

const mcp = program.command('mcp').description('Manage the MCP server of Bosco in a Claude Code profile');

/** Serveur MCP de Bosco dans le profil choisi, ajouté comme le fait l'installation du suivi en direct. */
function mcpServerOf(): ClaudeMcpServerInstaller {
  const config = loadConfig();
  const secret = loadHookSecret(config.dataDir);
  return new ClaudeMcpServerInstaller(config.worker.claudeBinary, config.profilesRoot, MCP_SERVER, {
    secret,
    url: `http://127.0.0.1:${config.port}/mcp`,
  });
}

/** Le résultat de Claude Code, qui écrit lui-même sa configuration : un échec est dit, puis la commande échoue. */
async function run(action: Promise<void>, done: string): Promise<void> {
  try {
    await action;
    console.log(done);
    process.exit(0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

mcp
  .command('install')
  .description('Add the MCP server of Bosco to a Claude Code profile, for every project')
  .option('--profile <dir>', 'Claude Code profile', join(homedir(), '.claude'))
  .action(async (options: { profile: string }) => {
    await run(mcpServerOf().install(options.profile), `in Claude Code, ask: « prends la prochaine tâche ${APP_NAME} »`);
  });

mcp
  .command('remove')
  .description('Remove the MCP server of Bosco from a Claude Code profile')
  .option('--profile <dir>', 'Claude Code profile', join(homedir(), '.claude'))
  .action(async (options: { profile: string }) => {
    await run(mcpServerOf().uninstall(options.profile), `removed from ${options.profile}`);
  });

await program.parseAsync();
