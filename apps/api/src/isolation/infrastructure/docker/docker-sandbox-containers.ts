// Conteneurs des bacs à sable des sessions : l'isolation des agents du worker (image, limites, utilisateur
// sans droits, réseau privé et proxy de sortie), mais un conteneur qui vit le temps de la session. Il attend sans
// rien faire entre deux tours ; chaque tour s'y exécute par docker exec. Arrêté, il se relance sans être recréé.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { AGENT_IMAGE, DOCKER, type DockerIsolation, LIMITS, PROXY, UNPRIVILEGED } from './docker-isolation.ts';

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
    workdir: string;
  },
  options: { claudeBinary: string; user: string },
): string[] {
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
    'NO_PROXY=localhost,127.0.0.1',
    '--env',
    'no_proxy=localhost,127.0.0.1',
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
  constructor(private readonly isolation: DockerIsolation) {}

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

  /** Démarre le conteneur et son proxy ; les recrée s'ils ont disparu (prune, poste redémarré). */
  async ensure(spec: {
    dir: string;
    key: string;
    mounts: { from: string; to: string }[];
    projects: readonly string[];
    workdir: string;
  }) {
    const names = this.names(spec.key);
    const state = await this.state(spec.key);
    if (state !== 'missing') {
      await run(DOCKER, ['start', names.proxy]).catch(() => undefined);
      if (state === 'stopped') await run(DOCKER, ['start', names.agent]);
      return;
    }
    await this.remove(spec.key);
    const isolation = await this.isolation.isolation({
      name: names.network,
      label: `bosco.session=${spec.key}`,
      dir: spec.dir,
      projects: spec.projects,
    });
    await run(DOCKER, agentRunArgs({ ...spec, name: names.agent, network: isolation.network }, this.isolation.options));
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

  async stop(key: string): Promise<void> {
    const names = this.names(key);
    await run(DOCKER, ['stop', '--time', '5', names.agent, names.proxy]).catch(() => undefined);
  }

  async remove(key: string): Promise<void> {
    const names = this.names(key);
    await run(DOCKER, ['rm', '--force', names.agent, names.proxy]).catch(() => undefined);
    await run(DOCKER, ['network', 'rm', names.network]).catch(() => undefined);
  }
}
