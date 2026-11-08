// Agent du worker dans un conteneur jetable (DT-08, RF-CONT-06) : Claude Code du poste, monté en lecture seule,
// travaille dans la copie du dépôt avec un dossier personnel temporaire, sous des limites de mémoire, de processeurs
// et de processus (E11a), sans droits d'administration. Le conteneur est supprimé à la fin.
import { execFile, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { promisify } from 'node:util';
import type { AgentEvent, AgentRun, AgentRunner, AgentSpec, WorkerHealth } from '../../application/ports.ts';
import { agentEventOf } from './stream-json.ts';

const DOCKER = '/usr/bin/docker';
const run = promisify(execFile);

/** Image de l'agent : git, ripgrep, Python et Node ; Claude Code vient du poste (même version que tes sessions). */
export const AGENT_IMAGE = 'bosco-agent:1';
const DOCKERFILE = `FROM node:26-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ripgrep python3 ca-certificates \\
  && rm -rf /var/lib/apt/lists/*
`;

/** Limites de chaque agent (8.4 du cahier des charges). */
const LIMITS = ['--memory', '4g', '--cpus', '2', '--pids-limit', '512'];

export interface DockerWorkerOptions {
  /** Exécutable de Claude Code du poste, monté dans le conteneur */
  claudeBinary: string;
  /** Identifiants de l'abonnement Claude du poste (DT-09) */
  credentials: string;
  /** Profil du worker : les sessions des agents y sont gardées pour l'historique */
  profile: string;
  user: string;
}

async function imageExists(): Promise<boolean> {
  return run(DOCKER, ['image', 'inspect', AGENT_IMAGE]).then(
    () => true,
    () => false,
  );
}

async function buildImage(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const build = spawn(DOCKER, ['build', '--quiet', '--tag', AGENT_IMAGE, '-'], { stdio: ['pipe', 'ignore', 'pipe'] });
    let errors = '';
    build.stderr.on('data', (chunk: Buffer) => (errors += chunk.toString()));
    build.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`docker build failed: ${errors.slice(-500)}`)),
    );
    build.stdin.end(DOCKERFILE);
  });
}

export class DockerAgentRunner implements AgentRunner, WorkerHealth {
  constructor(private readonly options: DockerWorkerOptions) {}

  /** null quand le worker peut lancer un agent ; sinon la raison, affichée « Worker indisponible » (E5c). */
  async check(): Promise<null | string> {
    if (!existsSync(DOCKER)) return 'Docker n’est pas installé';
    const docker = await run(DOCKER, ['version', '--format', '{{.Server.Version}}']).then(
      () => true,
      () => false,
    );
    if (!docker) return 'Docker ne répond pas';
    if (!existsSync(this.options.credentials)) return 'Accès à l’abonnement Claude introuvable';
    if (!existsSync(this.options.claudeBinary)) return 'Claude Code introuvable sur le poste';
    return null;
  }

  /** Conteneurs restés d'un arrêt brutal (NF-12). */
  async cleanup(): Promise<void> {
    const { stdout } = await run(DOCKER, ['ps', '--all', '--quiet', '--filter', 'label=bosco.task']).catch(() => ({
      stdout: '',
    }));
    const ids = stdout.split('\n').filter(Boolean);
    if (ids.length > 0) await run(DOCKER, ['rm', '--force', ...ids]).catch(() => undefined);
  }

  async start(spec: AgentSpec): Promise<AgentRun> {
    if (!(await imageExists())) await buildImage();
    const home = join(spec.workspace.dir, 'home');
    const config = join(home, '.claude');
    await mkdir(config, { recursive: true });
    await cp(this.options.credentials, join(config, '.credentials.json'));
    await writeFile(join(config, 'settings.json'), JSON.stringify({ autoUpdates: false }));
    const name = `bosco-t${spec.taskId}`;
    const child = spawn(
      DOCKER,
      [
        'run',
        '--rm',
        '--name',
        name,
        '--label',
        `bosco.task=${spec.taskId}`,
        ...LIMITS,
        '--user',
        this.options.user,
        '--cap-drop',
        'ALL',
        '--security-opt',
        'no-new-privileges',
        '--env',
        'HOME=/home/agent',
        '--env',
        'CLAUDE_CONFIG_DIR=/home/agent/.claude',
        '--env',
        'DISABLE_AUTOUPDATER=1',
        '--volume',
        `${this.options.claudeBinary}:/usr/local/bin/claude:ro`,
        '--volume',
        `${join(spec.workspace.dir, 'repo')}:/work`,
        '--volume',
        `${home}:/home/agent`,
        '--workdir',
        join('/work', spec.folder),
        AGENT_IMAGE,
        'claude',
        '-p',
        spec.prompt,
        '--output-format',
        'stream-json',
        '--verbose',
        '--max-turns',
        String(spec.maxTurns),
        '--model',
        spec.model,
        '--permission-mode',
        'dontAsk',
        '--allowedTools',
        spec.tools.join(','),
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const lines = createInterface({ input: child.stdout });
    // La session de l'agent rejoint le profil du worker, lu par l'historique (E2c, E2d)
    const finished = new Promise<void>((resolve) => child.on('exit', () => resolve())).then(() =>
      cp(join(config, 'projects'), join(this.options.profile, 'projects'), { recursive: true }).catch(() => undefined),
    );
    async function* events(): AsyncGenerator<AgentEvent> {
      for await (const line of lines) {
        const event = agentEventOf(line);
        if (event) yield event;
      }
    }
    return {
      events: events(),
      finished: () => finished,
      stop: async () => {
        await run(DOCKER, ['kill', name]).catch(() => undefined);
      },
    };
  }
}
