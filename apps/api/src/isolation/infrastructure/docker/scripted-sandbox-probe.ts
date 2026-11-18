import type { SandboxProbe } from '../../application/containers.service.ts';
import type { SandboxSample } from '../../domain/containers.ts';

/** Mémoire qu'un bac à sable démarré consomme dans les scénarios : 1,3 Go */
const SCRIPTED_MEMORY = 1.3 * 1024 ** 3;
/** Mémoire d'un service de données dans les scénarios : 60 Mo */
const SCRIPTED_SERVICE_MEMORY = 60 * 1024 ** 2;

/**
 * Mesure des bacs à sable dans les scénarios, sans Docker : chaque bac à sable démarré donne la même mesure, et les
 * scénarios peuvent faire comme si Docker ne répondait plus.
 */
export class ScriptedSandboxProbe implements SandboxProbe {
  reachable = true;

  /**
   * `running` : les bacs à sable démarrés (« bosco-s-<clé>-agent »), avec leurs services de données, qui donnent eux
   * aussi la même mesure
   */
  constructor(private readonly running: () => { key: string; services: { image: string; name: string }[] }[]) {}

  list(): Promise<SandboxSample[]> {
    if (!this.reachable) return Promise.reject(new Error('Cannot connect to the Docker daemon'));
    return Promise.resolve(
      this.running().flatMap(({ key, services }) => [
        { cpu: 0, key, memory: SCRIPTED_MEMORY, name: `bosco-s-${key}-agent`, service: null, since: null },
        ...services.map(({ image, name }) => ({
          cpu: 0,
          key,
          memory: SCRIPTED_SERVICE_MEMORY,
          name: `bosco-s-${key}-${name}-1`,
          service: { image, name, state: 'ready' as const },
          since: null,
        })),
      ]),
    );
  }
}
