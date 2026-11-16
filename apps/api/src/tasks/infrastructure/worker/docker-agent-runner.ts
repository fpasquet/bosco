// Agent du worker dans un conteneur jetable (DT-08, RF-CONT-06) : Claude Code du poste, monté en lecture seule,
// travaille dans la copie du dépôt avec un dossier personnel temporaire, sous des limites de mémoire, de processeurs
// et de processus (E11a), sans droits d'administration. Il est seul sur un réseau privé sans Internet : sa seule
// sortie est le proxy de la tâche, qui ne laisse passer que les domaines autorisés (E11b). Tout est supprimé à la fin.
import { execFile, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chmod, cp, mkdir, open, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import type { AgentEvent, AgentRun, AgentRunner, AgentSpec, WorkerHealth } from '../../application/ports.ts';
import type { EgressRefusal } from '../../domain/egress.ts';
import { AGENT_LIMITS } from '../../application/worker.service.ts';
import { ATLASSIAN_READ_TOOLS } from '../../domain/atlassian-read.ts';
import { servicesNote } from '../../domain/test-services.ts';
import { DockerTestServices, ensureImage } from './docker-test-services.ts';
import { agentEventsOf } from './stream-json.ts';

export const DOCKER = '/usr/bin/docker';
const run = promisify(execFile);

/** Image de l'agent : git, ripgrep, Python et Node ; Claude Code vient du poste (même version que tes sessions). */
export const AGENT_IMAGE = 'bosco-agent:1';
const DOCKERFILE = `FROM node:26-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ripgrep python3 ca-certificates \\
  && rm -rf /var/lib/apt/lists/*
`;

export const LIMITS = [
  '--memory',
  String(AGENT_LIMITS.memory),
  '--cpus',
  String(AGENT_LIMITS.cpus),
  '--pids-limit',
  String(AGENT_LIMITS.processes),
];

/** Sans droits d'administration, ni moyen d'en regagner. */
export const UNPRIVILEGED = ['--cap-drop', 'ALL', '--security-opt', 'no-new-privileges'];

/** Script du proxy de sortie, à côté de ce fichier : .ts en développement, .js une fois construit. */
const PROXY_SCRIPT = fileURLToPath(
  new URL(`../isolation/egress-proxy${extname(fileURLToPath(import.meta.url))}`, import.meta.url),
);
// Le proxy se joint en clair sur le réseau privé de la tâche ; le trafic vers Internet reste chiffré de bout en bout
// (tunnel CONNECT)
// eslint-disable-next-line sonarjs/no-clear-text-protocols
export const PROXY = 'http://egress:3128';
/** Relecture des refus notés par le proxy pendant la tâche. */
const REFUSALS_POLL_MS = 1000;

/** Attente du branchement des connecteurs de claude.ai au démarrage de l'agent : vérifiée sur le poste en 9 à 12 s */
const CONNECTOR_PREWAIT_MS = 30_000;

export interface DockerWorkerOptions {
  /** Exécutable de Claude Code du poste, monté dans le conteneur */
  claudeBinary: string;
  /**
   * Secrets d'une tâche qui démarre (E11b) : l'accès à l'abonnement Claude du profil choisi (DT-09) et le .npmrc
   * choisi, s'il existe ; une copie de chacun va dans le dossier personnel temporaire de l'agent.
   */
  secrets: (profile: null | string) => Promise<{ credentials: string; npmrc: null | string }>;
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

/**
 * Connecteurs de claude.ai (RF-CONT-14) : coupés, sauf quand la lecture de Jira et Confluence est activée ; l'agent
 * attend alors leur branchement, qui se fait en arrière-plan (réglage non documenté, vérifié par make claude-compat).
 * Les outils permis restent limités à la lecture par --allowedTools, en mode dontAsk.
 */
function connectorEnv(atlassianRead: boolean): string[] {
  return atlassianRead
    ? ['--env', `CLAUDE_CODE_MCP_CONNECTOR_PREWAIT_MS=${CONNECTOR_PREWAIT_MS}`]
    : ['--env', 'ENABLE_CLAUDEAI_MCP_SERVERS=false'];
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

/**
 * Session gardée dans le profil du worker remise dans le dossier personnel de l'agent pour une reprise (RF-TACH-10) :
 * l'inverse de keepSessions, la racine du dépôt redevient /work.
 */
async function restoreSession(
  sessionId: string,
  from: string,
  to: string,
  repository: { folder: string; root: string },
): Promise<void> {
  const hostPath = repository.folder ? join(repository.root, repository.folder) : repository.root;
  const content = await readFile(join(from, projectDir(hostPath), `${sessionId}.jsonl`), 'utf8');
  const escaped = JSON.stringify(repository.root).slice(1, -1);
  const target = join(to, projectDir(join('/work', repository.folder)));
  await mkdir(target, { recursive: true });
  await writeFile(join(target, `${sessionId}.jsonl`), content.replaceAll(`"cwd":"${escaped}`, '"cwd":"/work'));
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
    const { credentials } = await this.options.secrets(null);
    if (!existsSync(credentials)) return 'Accès à l’abonnement Claude introuvable';
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
    return this.isolation({ name: `bosco-t${taskId}`, label: `bosco.task=${taskId}`, dir, keep: false });
  }

  /**
   * Réseau privé et proxy de sortie, pour une tâche ou le bac à sable d'une session (DT-37) : seul le proxy est relié
   * aux deux réseaux, et ne laisse passer que les domaines autorisés. keep : le proxy survit à son arrêt, pour être
   * relancé avec le bac à sable.
   */
  async isolation(target: {
    dir: string;
    keep: boolean;
    label: string;
    name: string;
  }): Promise<{ network: string; proxy: string; refusals: string }> {
    if (!(await imageExists())) await buildImage();
    const network = target.name;
    const proxy = `${target.name}-egress`;
    const log = join(target.dir, 'egress');
    await mkdir(log, { recursive: true });
    const label = ['--label', target.label];
    await run(DOCKER, ['network', 'create', '--internal', ...label, network]);
    const script = `/bosco/egress-proxy${extname(PROXY_SCRIPT)}`;
    await run(DOCKER, [
      'run',
      '--detach',
      ...(target.keep ? [] : ['--rm']),
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
    const secrets = await this.options.secrets(spec.claudeProfile);
    await cp(secrets.credentials, join(config, '.credentials.json'));
    // Le .npmrc du poste, jetons compris : en lecture seule, supprimé avec le dossier personnel à la fin (E11b)
    if (secrets.npmrc) {
      await cp(secrets.npmrc, join(home, '.npmrc'));
      await chmod(join(home, '.npmrc'), 0o400);
    }
    await writeFile(join(config, 'settings.json'), JSON.stringify({ autoUpdates: false }));
    if (spec.resume)
      await restoreSession(spec.resume, join(this.options.profile, 'projects'), join(config, 'projects'), {
        folder: spec.folder,
        root: spec.repositoryRoot,
      });
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
        ...connectorEnv(spec.atlassianRead),
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
        ...(spec.resume ? ['--resume', spec.resume] : []),
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
        [...spec.tools, ...(spec.atlassianRead ? ATLASSIAN_READ_TOOLS : [])].join(','),
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
      for await (const line of lines) yield* agentEventsOf(line);
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
