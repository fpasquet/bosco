// Services de test d'une tâche (RF-CONT-08) : chacun dans son conteneur, sur le réseau privé de la tâche, joint par
// son nom ; sans port publié ni volume, limité en mémoire et en processeur. Un service qui n'est pas prêt à temps
// fait continuer la tâche sans services : l'échec n'est pas bloquant (CA-CONT-53).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { SERVICE_LIMITS, type ServiceLaunch, type TestService } from '../../domain/test-services.ts';

const DOCKER = '/usr/bin/docker';
const run = promisify(execFile);
const PULL_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_MS = 1000;
/** Sans vérification d'état, un service est prêt quand il tourne depuis ce délai. */
const SETTLE_MS = 2000;

/** Image présente sur le poste, téléchargée sinon avec l'accès du poste, que l'agent ne voit pas. */
export async function ensureImage(image: string): Promise<void> {
  const present = await run(DOCKER, ['image', 'inspect', image]).then(
    () => true,
    () => false,
  );
  if (!present) await run(DOCKER, ['pull', '--quiet', image], { timeout: PULL_TIMEOUT_MS });
}

function argumentsOf(service: TestService, taskId: number, network: string, name: string): string[] {
  const args = [
    'run',
    '--detach',
    '--name',
    name,
    '--label',
    `bosco.task=${taskId}`,
    '--network',
    network,
    '--network-alias',
    service.name,
    '--memory',
    String(SERVICE_LIMITS.memory),
    '--cpus',
    String(SERVICE_LIMITS.cpus),
    '--pids-limit',
    '512',
    '--security-opt',
    'no-new-privileges',
  ];
  for (const [key, value] of Object.entries(service.environment)) args.push('--env', `${key}=${value}`);
  if (service.healthcheck) {
    args.push('--health-cmd', service.healthcheck.command, '--health-interval', service.healthcheck.interval ?? '2s');
    if (service.healthcheck.timeout) args.push('--health-timeout', service.healthcheck.timeout);
    if (service.healthcheck.retries !== null) args.push('--health-retries', String(service.healthcheck.retries));
  }
  const [entrypoint, ...entrypointArgs] = service.entrypoint ?? [];
  if (entrypoint) args.push('--entrypoint', entrypoint);
  args.push(service.image ?? '', ...entrypointArgs, ...(service.command ?? []));
  return args;
}

/** « running healthy », « running », « exited » */
async function stateOf(name: string): Promise<string> {
  const { stdout } = await run(DOCKER, [
    'inspect',
    '--format',
    '{{.State.Status}}{{if .State.Health}} {{.State.Health.Status}}{{end}}',
    name,
  ]).catch(() => ({ stdout: 'missing' }));
  return stdout.trim();
}

/** Attend qu'un service soit prêt : sa vérification d'état, sinon quelques secondes en marche. */
export async function readiness(name: string, deadline: number): Promise<null | string> {
  let runningSince: null | number = null;
  while (Date.now() < deadline) {
    const state = await stateOf(name);
    const [status, health] = state.split(' ');
    if (status !== 'running' && status !== 'created') return 'arrêté au démarrage';
    if (health === 'healthy') return null;
    if (health === 'unhealthy') return 'vérification d’état en échec';
    if (!health && status === 'running') {
      runningSince ??= Date.now();
      if (Date.now() - runningSince >= SETTLE_MS) return null;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  return `pas prêt après ${SERVICE_LIMITS.waitSeconds} s`;
}

export class DockerTestServices {
  /** Lance les services et attend qu'ils soient prêts ; en cas d'échec, les supprime tous. */
  async start(
    taskId: number,
    network: string,
    services: readonly TestService[],
  ): Promise<{ containers: string[]; launches: ServiceLaunch[] }> {
    const started = Date.now();
    const deadline = started + SERVICE_LIMITS.waitSeconds * 1000;
    const containers: string[] = [];
    const launches = await Promise.all(
      services.map(async (service): Promise<ServiceLaunch> => {
        const image = service.image ?? '';
        const name = `bosco-t${taskId}-svc-${service.name.replaceAll(/[^\w.-]/g, '-')}`;
        try {
          await ensureImage(image);
          await run(DOCKER, argumentsOf(service, taskId, network, name));
          containers.push(name);
          const error = await readiness(name, deadline);
          return {
            name: service.name,
            image,
            error,
            readySeconds: error ? null : Math.round((Date.now() - started) / 1000),
          };
        } catch {
          return { name: service.name, image, error: 'image ou options refusées par Docker', readySeconds: null };
        }
      }),
    );
    if (launches.some((launch) => launch.error)) {
      await this.remove(containers);
      return { containers: [], launches };
    }
    return { containers, launches };
  }

  async remove(containers: readonly string[]): Promise<void> {
    if (containers.length > 0) await run(DOCKER, ['rm', '--force', ...containers]).catch(() => undefined);
  }
}
