// Agent du worker dans un conteneur jetable (DT-08, RF-CONT-06) : Claude Code du poste, monté en lecture seule,
// travaille dans la copie du dépôt avec un dossier personnel temporaire, sous des limites de mémoire, de processeurs
// et de processus (E11a), sans droits d'administration. Il est seul sur un réseau privé sans Internet : sa seule
// sortie est le proxy de la tâche, qui ne laisse passer que les domaines autorisés (E11b). Tout est supprimé à la fin.
import { execFile, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, open, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import type { AgentEvent, AgentRun, AgentRunner, AgentSpec, WorkerHealth } from '../../application/ports.ts';
import type { EgressRefusal } from '../../domain/egress.ts';
import { AGENT_LIMITS } from '../../application/worker.service.ts';
import { servicesNote } from '../../domain/test-services.ts';
import { DockerTestServices, ensureImage } from './docker-test-services.ts';
import { agentEventOf } from './stream-json.ts';

const DOCKER = '/usr/bin/docker';
const run = promisify(execFile);

/** Image de l'agent : git, ripgrep, Python et Node ; Claude Code vient du poste (même version que tes sessions). */
export const AGENT_IMAGE = 'bosco-agent:1';
const DOCKERFILE = `FROM node:26-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ripgrep python3 ca-certificates \\
  && rm -rf /var/lib/apt/lists/*
`;

const LIMITS = [
  '--memory',
  String(AGENT_LIMITS.memory),
  '--cpus',
  String(AGENT_LIMITS.cpus),
  '--pids-limit',
  String(AGENT_LIMITS.processes),
];

/** Sans droits d'administration, ni moyen d'en regagner. */
const UNPRIVILEGED = ['--cap-drop', 'ALL', '--security-opt', 'no-new-privileges'];

/** Script du proxy de sortie, à côté de ce fichier : .ts en développement, .js une fois construit. */
const PROXY_SCRIPT = fileURLToPath(
  new URL(`../isolation/egress-proxy${extname(fileURLToPath(import.meta.url))}`, import.meta.url),
);
// Le proxy se joint en clair sur le réseau privé de la tâche ; le trafic vers Internet reste chiffré de bout en bout
// (tunnel CONNECT)
// eslint-disable-next-line sonarjs/no-clear-text-protocols
const PROXY = 'http://egress:3128';
/** Relecture des refus notés par le proxy pendant la tâche. */
const REFUSALS_POLL_MS = 1000;

export interface DockerWorkerOptions {
  /** Exécutable de Claude Code du poste, monté dans le conteneur */
  claudeBinary: string;
  /** Identifiants de l'abonnement Claude du poste (DT-09) */
  credentials: string;
  /** Profil du worker : les sessions des agents y sont gardées pour l'historique */
  /** Dossier de la liste des domaines autorisés, monté en lecture seule dans le proxy */
  allowDir: string;
  /** Chaque refus du proxy, attribué à sa tâche (E11b) */
  onRefusal: (refusal: EgressRefusal) => void;
  /** Une session d'agent rejoint le profil du worker : il devient une source surveillée (E2c, E2d) */
  onSessionSaved: () => void;
  profile: string;
  user: string;
}

/** Dossier d'un projet tel que Claude Code le nomme : le chemin, chaque caractère hors lettres et chiffres en « - ». */
export function projectDir(path: string): string {
  return path.replaceAll(/[^a-zA-Z0-9]/g, '-');
}

/**
 * Sessions de l'agent gardées dans le profil du worker, rattachées au dépôt du poste : /work devient la racine du
 * dépôt, dans le fil comme dans le nom du dossier, pour que l'historique les range avec le dépôt et que la reprise
 * fonctionne depuis le poste. true si une session a été gardée.
 */
async function keepSessions(from: string, to: string, repository: { folder: string; root: string }): Promise<boolean> {
  const hostPath = repository.folder ? join(repository.root, repository.folder) : repository.root;
  const escaped = JSON.stringify(repository.root).slice(1, -1);
  let saved = false;
  for (const dir of await readdir(from)) {
    const target = join(to, projectDir(hostPath));
    await mkdir(target, { recursive: true });
    const files = await readdir(join(from, dir));
    for (const file of files.filter((name) => name.endsWith('.jsonl'))) {
      const content = await readFile(join(from, dir, file), 'utf8');
      await writeFile(join(target, file), content.replaceAll(/"cwd":\s*"\/work/g, `"cwd":"${escaped}`));
      saved = true;
    }
  }
  return saved;
}

/** Suit les refus notés par le proxy dans son journal, depuis la dernière lecture. */
function refusalReader(file: string, taskId: number, onRefusal: (refusal: EgressRefusal) => void) {
  let offset = 0;
  let pending = '';
  return async () => {
    const handle = await open(file, 'r').catch(() => null);
    if (!handle) return;
    try {
      const { size } = await handle.stat();
      if (size <= offset) return;
      const buffer = Buffer.alloc(size - offset);
      await handle.read(buffer, 0, buffer.length, offset);
      offset = size;
      const lines = (pending + buffer.toString('utf8')).split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines.filter(Boolean)) {
        const { at, host } = JSON.parse(line) as { at: string; host: string };
        onRefusal({ at: new Date(at), host, taskId });
      }
    } finally {
      await handle.close();
    }
  };
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
  private readonly services = new DockerTestServices();

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
    const networks = await run(DOCKER, ['network', 'ls', '--quiet', '--filter', 'label=bosco.task']).catch(() => ({
      stdout: '',
    }));
    const left = networks.stdout.split('\n').filter(Boolean);
    if (left.length > 0) await run(DOCKER, ['network', 'rm', ...left]).catch(() => undefined);
  }

  /** Réseau privé de la tâche, sans route vers Internet, et son proxy, seul relié aux deux réseaux. */
  private async isolate(taskId: number, dir: string): Promise<{ network: string; proxy: string; refusals: string }> {
    const network = `bosco-t${taskId}`;
    const proxy = `bosco-t${taskId}-egress`;
    const log = join(dir, 'egress');
    await mkdir(log, { recursive: true });
    const label = ['--label', `bosco.task=${taskId}`];
    await run(DOCKER, ['network', 'create', '--internal', ...label, network]);
    const script = `/bosco/egress-proxy${extname(PROXY_SCRIPT)}`;
    await run(DOCKER, [
      'run',
      '--detach',
      '--rm',
      '--name',
      proxy,
      ...label,
      '--memory',
      String(256 * 1024 ** 2),
      '--cpus',
      '0.5',
      '--pids-limit',
      '64',
      '--user',
      this.options.user,
      ...UNPRIVILEGED,
      '--volume',
      `${this.options.allowDir}:/bosco/allow:ro`,
      '--volume',
      `${log}:/bosco/log`,
      '--volume',
      `${PROXY_SCRIPT}:${script}:ro`,
      AGENT_IMAGE,
      'node',
      script,
    ]);
    await run(DOCKER, ['network', 'connect', '--alias', 'egress', network, proxy]);
    return { network, proxy, refusals: join(log, 'refusals.jsonl') };
  }

  async start(spec: AgentSpec): Promise<AgentRun> {
    // Le proxy tourne toujours dans l'image par défaut ; l'agent, dans celle du dépôt s'il en a une (CA-CONT-54)
    if (!(await imageExists())) await buildImage();
    const image = spec.image ?? AGENT_IMAGE;
    if (spec.image) await ensureImage(spec.image);
    const home = join(spec.workspace.dir, 'home');
    const config = join(home, '.claude');
    await mkdir(config, { recursive: true });
    await cp(this.options.credentials, join(config, '.credentials.json'));
    await writeFile(join(config, 'settings.json'), JSON.stringify({ autoUpdates: false }));
    const isolation = await this.isolate(spec.taskId, spec.workspace.dir);
    const readRefusals = refusalReader(isolation.refusals, spec.taskId, this.options.onRefusal);
    const polling = setInterval(() => void readRefusals().catch(() => undefined), REFUSALS_POLL_MS);
    const services =
      spec.services.length > 0
        ? await this.services.start(spec.taskId, isolation.network, spec.services)
        : { containers: [], launches: [] };
    if (spec.services.length > 0) spec.onServices(services.launches);
    const prompt = [spec.prompt, servicesNote(services.launches)].filter(Boolean).join('\n\n');
    // Les services se joignent directement, par leur nom, sur le réseau privé
    const direct = ['localhost', '127.0.0.1', ...spec.services.map((service) => service.name)].join(',');
    const name = `bosco-t${spec.taskId}`;
    const proxyEnv = ['HTTPS_PROXY', 'HTTP_PROXY', 'https_proxy', 'http_proxy'].flatMap((key) => [
      '--env',
      `${key}=${PROXY}`,
    ]);
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
        '--network',
        isolation.network,
        '--user',
        this.options.user,
        ...UNPRIVILEGED,
        ...proxyEnv,
        '--env',
        `NO_PROXY=${direct}`,
        '--env',
        `no_proxy=${direct}`,
        // Pas de télémétrie ni de rapport d'erreur : seule l'API de Claude est jointe
        '--env',
        'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1',
        // Ni les connecteurs de claude.ai : l'agent n'a aucun serveur MCP (E11a)
        '--env',
        'ENABLE_CLAUDEAI_MCP_SERVERS=false',
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
        image,
        'claude',
        '-p',
        prompt,
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
        ...(spec.deniedTools.length > 0 ? ['--disallowedTools', spec.deniedTools.join(',')] : []),
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const lines = createInterface({ input: child.stdout });
    // La session de l'agent rejoint le profil du worker, lu par l'historique (E2c, E2d) ; le proxy et le réseau
    // de la tâche sont supprimés
    const finished = new Promise<void>((resolve) => child.on('exit', () => resolve())).then(async () => {
      clearInterval(polling);
      await readRefusals().catch(() => undefined);
      const saved = await keepSessions(join(config, 'projects'), join(this.options.profile, 'projects'), {
        folder: spec.folder,
        root: spec.repositoryRoot,
      }).catch(() => false);
      if (saved) this.options.onSessionSaved();
      await this.services.remove(services.containers);
      await run(DOCKER, ['rm', '--force', isolation.proxy]).catch(() => undefined);
      await run(DOCKER, ['network', 'rm', isolation.network]).catch(() => undefined);
    });
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
