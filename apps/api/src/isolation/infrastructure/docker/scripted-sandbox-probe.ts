import type { SandboxProbe } from '../../application/containers.service.ts';
import type { SandboxSample } from '../../domain/containers.ts';

/** Mémoire qu'un bac à sable démarré consomme dans les scénarios : 1,3 Go */
const SCRIPTED_MEMORY = 1.3 * 1024 ** 3;

/**
 * Mesure des bacs à sable dans les scénarios, sans Docker : chaque bac à sable démarré donne la même mesure, et les
 * scénarios peuvent faire comme si Docker ne répondait plus.
 */
export class ScriptedSandboxProbe implements SandboxProbe {
  reachable = true;

  /** `running` : les clés des bacs à sable démarrés (« bosco-s-<clé>-agent ») */
  constructor(private readonly running: () => string[]) {}

  list(): Promise<SandboxSample[]> {
    if (!this.reachable) return Promise.reject(new Error('Cannot connect to the Docker daemon'));
    return Promise.resolve(
      this.running().map((key) => ({ cpu: 0, key, memory: SCRIPTED_MEMORY, name: `bosco-s-${key}-agent` })),
    );
  }
}
