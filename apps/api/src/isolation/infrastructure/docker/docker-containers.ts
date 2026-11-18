// Conteneurs des bacs à sable vus par la commande docker : ceux étiquetés `bosco.session` (l'agent et les services de
// données du projet), mesurés par une lecture ponctuelle de `docker stats` (mémoire sans le cache de fichiers inactif,
// comme la commande l'affiche).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { SandboxProbe } from '../../application/containers.service.ts';
import {
  bytesOf,
  coresOf,
  dockerDateOf,
  sandboxKeyOf,
  type SandboxSample,
  serviceStateOf,
} from '../../domain/containers.ts';
import { DOCKER } from './docker-isolation.ts';

const run = promisify(execFile);
/** Au-delà, Docker est considéré comme ne répondant pas */
const TIMEOUT_MS = 10_000;

interface StatsLine {
  CPUPerc: string;
  MemUsage: string;
  Name: string;
}

interface PsLine {
  CreatedAt: string;
  Image: string;
  Labels: string;
  Names: string;
  State: string;
  Status: string;
}

/** « bosco.session=c41e9a0712ab,bosco.service=db » → les étiquettes */
function labelsOf(text: string): Map<string, string> {
  return new Map(
    text.split(',').flatMap((pair) => {
      const at = pair.indexOf('=');
      return at === -1 ? [] : [[pair.slice(0, at), pair.slice(at + 1)] as const];
    }),
  );
}

/** Conteneur d'un bac à sable : l'agent (reconnu à son nom) ou un service de données (à son étiquette) */
type Known = Omit<SandboxSample, 'cpu' | 'memory'> & { running: boolean };

/**
 * Les conteneurs de bacs à sable de `docker ps --all --format json` : les agents démarrés, et les services de données
 * démarrés ou arrêtés en échec. Le proxy de sortie n'est pas mesuré.
 */
export function sandboxContainersOf(stdout: string): Known[] {
  return stdout
    .split('\n')
    .filter((line) => line.trim().startsWith('{'))
    .flatMap((line): Known[] => {
      const ps = JSON.parse(line) as PsLine;
      const labels = labelsOf(ps.Labels);
      const since = dockerDateOf(ps.CreatedAt);
      const running = ps.State === 'running';
      const agentKey = sandboxKeyOf(ps.Names);
      if (agentKey) return running ? [{ key: agentKey, name: ps.Names, running, service: null, since }] : [];
      const key = labels.get('bosco.session');
      const name = labels.get('bosco.service');
      if (!key || !name) return [];
      const state = serviceStateOf(ps.Status);
      // Un service arrêté avec son bac à sable n'est plus listé ; arrêté en échec, il l'est, sans mesure
      if (!running && ps.Status.startsWith('Exited (0)')) return [];
      return [{ key, name: ps.Names, running, service: { image: ps.Image, name, state }, since }];
    });
}

export class DockerSandboxProbe implements SandboxProbe {
  async list(): Promise<SandboxSample[]> {
    const { stdout: listed } = await run(
      DOCKER,
      ['ps', '--all', '--filter', 'label=bosco.session', '--format', '{{json .}}'],
      { timeout: TIMEOUT_MS },
    );
    const known = sandboxContainersOf(listed);
    const measured = known.filter(({ running }) => running).map(({ name }) => name);
    const stats = new Map<string, StatsLine>();
    if (measured.length > 0) {
      const { stdout } = await run(DOCKER, ['stats', '--no-stream', '--format', '{{json .}}', ...measured], {
        timeout: TIMEOUT_MS,
      });
      for (const line of stdout.split('\n').filter((entry) => entry.trim().startsWith('{'))) {
        const parsed = JSON.parse(line) as StatsLine;
        stats.set(parsed.Name, parsed);
      }
    }
    return known.map(({ running: _running, ...container }) => {
      const measure = stats.get(container.name);
      return {
        ...container,
        cpu: measure ? coresOf(measure.CPUPerc) : 0,
        memory: measure ? bytesOf(measure.MemUsage.split('/')[0] ?? '') : 0,
      };
    });
  }
}
