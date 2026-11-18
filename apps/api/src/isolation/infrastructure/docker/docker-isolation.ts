// Isolation Docker des bacs à sable : l'image de l'agent, ses limites de mémoire, de processeurs et de
// processus, un utilisateur sans droits d'administration, et un réseau privé sans Internet dont la seule sortie est un
// proxy qui ne laisse passer que les domaines autorisés.
import { execFile, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import type { SandboxAccess } from '../../../shared/domain/profile-access.ts';
import { projectAllowFile } from '../egress/allow-list-file.ts';

export const DOCKER = '/usr/bin/docker';
const run = promisify(execFile);

/** Image de l'agent : git, ripgrep, Python et Node ; Claude Code vient du poste (même version que tes sessions). */
export const AGENT_IMAGE = 'bosco-agent:1';
const DOCKERFILE = `FROM node:26-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ripgrep python3 ca-certificates \\
  && rm -rf /var/lib/apt/lists/*
`;

/** Limites de chaque bac à sable : mémoire, processeurs et processus. */
export const AGENT_LIMITS = { memory: 4 * 1024 ** 3, cpus: 2, processes: 512 } as const;

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

/** Script du proxy de sortie : .ts en développement, .js une fois construit. */
const PROXY_SCRIPT = fileURLToPath(
  new URL(`../egress/egress-proxy${extname(fileURLToPath(import.meta.url))}`, import.meta.url),
);
// Le proxy se joint en clair sur le réseau privé ; le trafic vers Internet reste chiffré de bout en bout (CONNECT)
// eslint-disable-next-line sonarjs/no-clear-text-protocols
export const PROXY = 'http://egress:3128';

export interface DockerIsolationOptions {
  /** Dossier de la liste des domaines autorisés, monté en lecture seule dans le proxy */
  allowDir: string;
  /** Exécutable de Claude Code du poste, monté en lecture seule */
  claudeBinary: string;
  /** Accès à l'abonnement par défaut (connexion ou fichier du jeton) : sans lui, aucun bac à sable ne démarre */
  access: () => Promise<SandboxAccess>;
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

export class DockerIsolation {
  constructor(readonly options: DockerIsolationOptions) {}

  /** null quand un bac à sable peut démarrer ; sinon la raison (« Docker ne répond pas »). */
  async check(): Promise<null | string> {
    if (!existsSync(DOCKER)) return 'Docker n’est pas installé';
    const docker = await run(DOCKER, ['version', '--format', '{{.Server.Version}}']).then(
      () => true,
      () => false,
    );
    if (!docker) return 'Docker ne répond pas';
    const access = await this.options.access();
    if (!existsSync(access.kind === 'login' ? access.credentials : access.tokenFile))
      return 'Accès à l’abonnement Claude introuvable';
    if (!existsSync(this.options.claudeBinary)) return 'Claude Code introuvable sur le poste';
    return null;
  }

  /**
   * Réseau privé et proxy de sortie d'un bac à sable : seul le proxy est relié aux deux réseaux, et ne laisse passer
   * que les domaines autorisés. Il survit à son arrêt, pour être relancé avec le bac à sable.
   */
  async isolation(target: {
    dir: string;
    label: string;
    name: string;
    /** Chemins des projets du bac à sable : leurs domaines propres s'ajoutent à la liste générale */
    projects: readonly string[];
  }): Promise<{ network: string; proxy: string }> {
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
      // Un init transmet le signal d'arrêt au proxy, qui s'arrête et repart avec le bac à sable
      '--init',
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
      '--env',
      `BOSCO_EGRESS_PROJECTS=${target.projects.map(projectAllowFile).join(',')}`,
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
    return { network, proxy };
  }
}
