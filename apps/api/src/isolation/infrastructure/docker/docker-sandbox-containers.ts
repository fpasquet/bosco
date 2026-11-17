// Conteneurs des bacs à sable des sessions (DT-37) : l'isolation des agents du worker (image, limites, utilisateur
// sans droits, réseau privé et proxy de sortie), mais un conteneur qui vit le temps de la session. Il attend sans
// rien faire entre deux tours ; chaque tour s'y exécute par docker exec. Arrêté, il se relance sans être recréé.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { AGENT_IMAGE, DOCKER, type DockerIsolation, LIMITS, PROXY, UNPRIVILEGED } from './docker-isolation.ts';

const run = promisify(execFile);

type State = 'missing' | 'running' | 'stopped';

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
    const proxyEnv = ['HTTPS_PROXY', 'HTTP_PROXY', 'https_proxy', 'http_proxy'].flatMap((key) => [
      '--env',
      `${key}=${PROXY}`,
    ]);
    await run(DOCKER, [
      'run',
      '--detach',
      // Un init en tête : l'attente s'arrête au signal, sans les 5 s du délai de docker stop
      '--init',
      '--name',
      names.agent,
      '--label',
      `bosco.session=${spec.key}`,
      ...LIMITS,
      '--network',
      isolation.network,
      '--user',
      this.isolation.options.user,
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
      `${this.isolation.options.claudeBinary}:/usr/local/bin/claude:ro`,
      ...spec.mounts.flatMap(({ from, to }) => ['--volume', `${from}:${to}`]),
      '--workdir',
      spec.workdir,
      AGENT_IMAGE,
      'sleep',
      'infinity',
    ]);
  }

  exec(key: string): { args: string[]; file: string } {
    return { file: DOCKER, args: ['exec', '--interactive', this.names(key).agent, 'claude'] };
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
