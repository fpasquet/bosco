// Conteneurs de Bosco vus par la commande docker (DT-35) : ceux étiquetés `bosco.task`, mesurés par une lecture
// ponctuelle de `docker stats` (mémoire sans le cache de fichiers inactif, comme la commande l'affiche).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ContainerProbe } from '../../application/containers.service.ts';
import { bytesOf, containerNameOf, type ContainerSample, coresOf } from '../../domain/containers.ts';
import { readiness } from './docker-test-services.ts';

const DOCKER = '/usr/bin/docker';
const run = promisify(execFile);
/** Au-delà, Docker est considéré comme ne répondant pas */
const TIMEOUT_MS = 10_000;

interface PsLine {
  Image: string;
  Names: string;
  Size?: string;
  State: string;
}

interface StatsLine {
  CPUPerc: string;
  MemUsage: string;
  Name: string;
}

function jsonLines<T>(stdout: string): T[] {
  return stdout
    .split('\n')
    .filter((line) => line.trim().startsWith('{'))
    .map((line) => JSON.parse(line) as T);
}

export class DockerContainers implements ContainerProbe {
  async list(): Promise<ContainerSample[]> {
    const { stdout } = await run(
      DOCKER,
      ['ps', '--all', '--no-trunc', '--filter', 'label=bosco.task', '--format', '{{json .}}'],
      { timeout: TIMEOUT_MS },
    );
    const containers = jsonLines<PsLine>(stdout).flatMap((line) => {
      const parsed = containerNameOf(line.Names);
      return parsed ? [{ ...parsed, image: line.Image, name: line.Names, running: line.State === 'running' }] : [];
    });
    const running = containers.filter((container) => container.running).map(({ name }) => name);
    const stats = new Map<string, StatsLine>();
    if (running.length > 0) {
      const { stdout: lines } = await run(DOCKER, ['stats', '--no-stream', '--format', '{{json .}}', ...running], {
        timeout: TIMEOUT_MS,
      }).catch(() => ({ stdout: '' }));
      for (const line of jsonLines<StatsLine>(lines)) stats.set(line.Name, line);
    }
    return containers.map((container) => {
      const line = stats.get(container.name);
      return {
        ...container,
        cpu: line ? coresOf(line.CPUPerc) : 0,
        memory: line ? bytesOf(line.MemUsage.split('/')[0] ?? '') : 0,
      };
    });
  }

  async diskOf(names: readonly string[]): Promise<number> {
    const { stdout } = await run(
      DOCKER,
      ['ps', '--all', '--size', '--filter', 'label=bosco.task', '--format', '{{json .}}'],
      { timeout: TIMEOUT_MS },
    ).catch(() => ({ stdout: '' }));
    // « 12.3MB (virtual 1.2GB) » : seule la couche propre au conteneur part avec lui, l'image reste sur le poste
    return jsonLines<PsLine>(stdout)
      .filter((line) => names.includes(line.Names))
      .reduce((sum, line) => sum + bytesOf((line.Size ?? '').split('(')[0] ?? ''), 0);
  }

  async logs(name: string, lines: number): Promise<string> {
    const { stderr, stdout } = await run(DOCKER, ['logs', '--tail', String(lines), name], {
      maxBuffer: 4 * 1024 ** 2,
      timeout: TIMEOUT_MS,
    });
    return [stdout, stderr].filter(Boolean).join('\n');
  }

  async remove(names: readonly string[]): Promise<void> {
    if (names.length === 0) return;
    await run(DOCKER, ['rm', '--force', ...names], { timeout: TIMEOUT_MS }).catch(() => undefined);
    // Le réseau privé d'une tâche part avec ses derniers conteneurs
    const tasks = new Set(names.flatMap((name) => containerNameOf(name)?.taskId ?? []));
    for (const taskId of tasks)
      await run(DOCKER, ['network', 'rm', `bosco-t${taskId}`], { timeout: TIMEOUT_MS }).catch(() => undefined);
  }

  async restart(name: string, waitSeconds: number): Promise<null | string> {
    await run(DOCKER, ['restart', name], { timeout: TIMEOUT_MS * 3 });
    return readiness(name, Date.now() + waitSeconds * 1000);
  }
}
