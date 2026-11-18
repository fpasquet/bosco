// Conteneurs des bacs à sable des sessions : l'isolation des agents du worker (image, limites, utilisateur
// sans droits, réseau privé et proxy de sortie), mais un conteneur qui vit le temps de la session. Il attend sans
// rien faire entre deux tours ; chaque tour s'y exécute par docker exec. Arrêté, il se relance sans être recréé.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { AGENT_IMAGE, DOCKER, type DockerIsolation, LIMITS, PROXY, UNPRIVILEGED } from './docker-isolation.ts';
import { DockerSandboxServices, NO_SERVICES, type SandboxServices } from './docker-sandbox-services.ts';

const run = promisify(execFile);

type State = 'missing' | 'running' | 'stopped';

/**
 * Lancement du conteneur de l'agent d'un bac à sable : les plafonds, l'utilisateur sans droits, le réseau privé et son
 * proxy de sortie, et pour seuls dossiers le binaire de Claude Code et ceux que le bac à sable monte.
 */
export function agentRunArgs(
  spec: {
    key: string;
    mounts: readonly { from: string; to: string }[];
    name: string;
    network: string;
    /** Services de données du bac à sable : joints directement, jamais par le proxy */
    services?: readonly string[];
    workdir: string;
  },
  options: { claudeBinary: string; user: string },
): string[] {
  const direct = ['localhost', '127.0.0.1', ...(spec.services ?? [])].join(',');
  const proxyEnv = ['HTTPS_PROXY', 'HTTP_PROXY', 'https_proxy', 'http_proxy'].flatMap((key) => [
    '--env',
    `${key}=${PROXY}`,
  ]);
  return [
    'run',
    '--detach',
    // Un init en tête : l'attente s'arrête au signal, sans les 5 s du délai de docker stop
    '--init',
    '--name',
    spec.name,
    '--label',
    `bosco.session=${spec.key}`,
    ...LIMITS,
    '--network',
    spec.network,
    '--user',
    options.user,
    ...UNPRIVILEGED,
    ...proxyEnv,
    '--env',
    `NO_PROXY=${direct}`,
    '--env',
    `no_proxy=${direct}`,
    // fetch de Node ignore HTTP(S)_PROXY sans ce réglage : sans lui, il ne résout aucun nom (EAI_AGAIN)
    '--env',
    'NODE_USE_ENV_PROXY=1',
    // Corepack télécharge pnpm ou Yarn sans demander de confirmation, qu'aucun tour ne pourrait donner
    '--env',
    'COREPACK_ENABLE_DOWNLOAD_PROMPT=0',
    // La télémétrie des outils (Next.js, Turborepo…) serait refusée par le proxy à chaque commande
    '--env',
    'DO_NOT_TRACK=1',
    '--env',
    'NEXT_TELEMETRY_DISABLED=1',
    '--env',
    'TURBO_TELEMETRY_DISABLED=1',
    // Ni télémétrie, ni connecteurs de claude.ai, ni mise à jour : rien d'autre du profil n'entre
    '--env',
    'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1',
    '--env',
    'ENABLE_CLAUDEAI_MCP_SERVERS=false',
    '--env',
    'DISABLE_AUTOUPDATER=1',
    '--env',
    'HOME=/home/agent',
    '--env',
    'CLAUDE_CONFIG_DIR=/home/agent/.claude',
    '--volume',
    `${options.claudeBinary}:/usr/local/bin/claude:ro`,
    ...spec.mounts.flatMap(({ from, to }) => ['--volume', `${from}:${to}`]),
    '--workdir',
    spec.workdir,
    AGENT_IMAGE,
    'sleep',
    'infinity',
  ];
}

export class DockerSandboxContainers {
  constructor(
    private readonly isolation: DockerIsolation,
    private readonly services = new DockerSandboxServices(),
  ) {}

  private names(key: string) {
    return { agent: `bosco-s-${key}-agent`, network: `bosco-s-${key}`, proxy: `bosco-s-${key}-egress` };
  }

  unavailable(): Promise<null | string> {
    return this.isolation.check();
  }

  async state(key: string): Promise<State> {
    const { stdout } = await run(DOCKER, ['inspect', '--format', '{{.State.Running}}', this.names(key).agent]).catch(
      () => ({ stdout: '' }),
    );
    if (!stdout.trim()) return 'missing';
    return stdout.trim() === 'true' ? 'running' : 'stopped';
  }

  /**
   * Démarre le conteneur, son proxy et les services de données du projet ; les recrée s'ils ont disparu (prune, poste
   * redémarré). Les services se lisent dans la copie du projet principal, avant l'agent, qui les joint sans proxy.
   */
  async ensure(spec: {
    dir: string;
    key: string;
    mounts: { from: string; to: string }[];
    projects: readonly string[];
    servicesFrom: string;
    workdir: string;
  }): Promise<SandboxServices> {
    const names = this.names(spec.key);
    const state = await this.state(spec.key);
    if (state !== 'missing') {
      await run(DOCKER, ['start', names.proxy]).catch(() => undefined);
      const services = await this.services.restart(spec);
      if (state === 'stopped') await run(DOCKER, ['start', names.agent]);
      return services;
    }
    await this.remove(spec.key, spec.dir);
    const isolation = await this.isolation.isolation({
      name: names.network,
      label: `bosco.session=${spec.key}`,
      dir: spec.dir,
      projects: spec.projects,
    });
    const services = await this.services
      .start({ dir: spec.dir, key: spec.key, network: isolation.network, projectDir: spec.servicesFrom })
      .catch((error: unknown) => ({ ...NO_SERVICES, error: error instanceof Error ? error.message : String(error) }));
    await run(
      DOCKER,
      agentRunArgs(
        {
          ...spec,
          name: names.agent,
          network: isolation.network,
          services: services.services.map(({ name }) => name),
        },
        this.isolation.options,
      ),
    );
    return services;
  }

  exec(key: string, env: readonly string[] = []): { args: string[]; file: string } {
    // Les instructions (CLAUDE.md) des projets ajoutés par --add-dir ne se lisent qu'avec ce réglage
    const instructions = ['--env', 'CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1'];
    // Une variable nommée sans valeur prend celle de l'environnement de docker : le jeton n'est pas dans les arguments
    const passed = env.flatMap((name) => ['--env', name]);
    return {
      file: DOCKER,
      args: ['exec', '--interactive', ...instructions, ...passed, this.names(key).agent, 'claude'],
    };
  }

  async stop(key: string, dir: string): Promise<void> {
    const names = this.names(key);
    await run(DOCKER, ['stop', '--time', '5', names.agent, names.proxy]).catch(() => undefined);
    await this.services.stop({ dir, key });
  }

  /** Conteneurs, services et leurs volumes, puis le réseau privé, qu'ils ne retiennent plus. */
  async remove(key: string, dir: string): Promise<void> {
    const names = this.names(key);
    await run(DOCKER, ['rm', '--force', names.agent, names.proxy]).catch(() => undefined);
    await this.services.remove({ dir, key });
    await run(DOCKER, ['network', 'rm', names.network]).catch(() => undefined);
  }
}
