// Conteneurs des bacs à sable vus par la commande docker (DT-35) : ceux étiquetés `bosco.session`, mesurés par une
// lecture ponctuelle de `docker stats` (mémoire sans le cache de fichiers inactif, comme la commande l'affiche).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { SandboxProbe } from '../../application/containers.service.ts';
import { bytesOf, coresOf, sandboxKeyOf, type SandboxSample } from '../../domain/containers.ts';
import { DOCKER } from './docker-isolation.ts';

const run = promisify(execFile);
/** Au-delà, Docker est considéré comme ne répondant pas */
const TIMEOUT_MS = 10_000;

interface StatsLine {
  CPUPerc: string;
  MemUsage: string;
  Name: string;
}

export class DockerSandboxProbe implements SandboxProbe {
  async list(): Promise<SandboxSample[]> {
    const { stdout: names } = await run(DOCKER, ['ps', '--filter', 'label=bosco.session', '--format', '{{.Names}}'], {
      timeout: TIMEOUT_MS,
    });
    const agents = names.split('\n').filter((name) => sandboxKeyOf(name.trim()) !== null);
    if (agents.length === 0) return [];
    const { stdout } = await run(DOCKER, ['stats', '--no-stream', '--format', '{{json .}}', ...agents], {
      timeout: TIMEOUT_MS,
    });
    return stdout
      .split('\n')
      .filter((line) => line.trim().startsWith('{'))
      .flatMap((line) => {
        const stats = JSON.parse(line) as StatsLine;
        const key = sandboxKeyOf(stats.Name);
        if (!key) return [];
        return [
          {
            cpu: coresOf(stats.CPUPerc),
            key,
            memory: bytesOf(stats.MemUsage.split('/')[0] ?? ''),
            name: stats.Name,
          },
        ];
      });
  }
}
