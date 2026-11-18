import type { SandboxSample } from '../domain/containers.ts';
import type { Clock } from './ports.ts';

/** Mesure de l'état du poste toutes les 5 s ; Docker injoignable se retente toutes les 30 s. */
export const MEASURE_MS = 5000;
export const RETRY_MS = 30_000;

/** Les conteneurs des bacs à sable démarrés, mesurés par Docker. */
export interface SandboxProbe {
  list(): Promise<SandboxSample[]>;
}

/** Tours de sessions pilotées en cours sur le poste, mesurés sur leurs processus */
export interface PilotedTurnsProbe {
  list(): Promise<{ cpu: number; memory: number; sessionId: string; since: Date; title: string }[]>;
}

export interface ContainerEvents {
  containersChanged(view: ContainersView): void;
}

export interface Usage {
  cpu: number;
  cpuLimit: null | number;
  memory: number;
  memoryLimit: null | number;
}

/** Un service de données du projet, démarré avec son bac à sable */
export interface ServiceView extends Usage {
  image: string;
  name: string;
  since: Date | null;
  state: 'failed' | 'ready' | 'starting';
}

export interface SandboxView extends Usage {
  name: string;
  /** Projet principal de la session */
  project: null | string;
  services: ServiceView[];
  sessionId: null | string;
  since: Date | null;
  title: string;
}

export interface ContainersView {
  hostCpus: number;
  measuredAt: Date | null;
  piloted: (Usage & { sessionId: string; since: Date; title: string })[];
  sandboxes: SandboxView[];
  totals: { cpu: number; memory: number; piloted: number; sandboxes: number };
  unreachableSince: Date | null;
}

export interface ContainersDeps {
  clock: Clock;
  events: ContainerEvents;
  hostCpus: number;
  /** Plafonds de chaque bac à sable */
  limits: { cpus: number; memory: number };
  /** Plafonds de chaque service de données */
  serviceLimits: { cpus: number; memory: number };
  pilots: PilotedTurnsProbe;
  probe: SandboxProbe;
  /** Sessions en bac à sable, avec la clé de leurs conteneurs, leur titre et leur projet */
  sandboxedSessions: () => Promise<{ key: string; project: null | string; sessionId: string; title: string }[]>;
}

/**
 * Conteneurs en cours : les bacs à sable démarrés et les tours pilotés sur le poste, mesurés toutes
 * les 5 s et publiés en direct. Bosco ne lance rien d'ici : un bac à sable s'arrête depuis sa session.
 */
export class ContainersService {
  private view: ContainersView;
  private lastAttempt = 0;

  constructor(private readonly deps: ContainersDeps) {
    this.view = {
      hostCpus: deps.hostCpus,
      measuredAt: null,
      piloted: [],
      sandboxes: [],
      totals: { cpu: 0, memory: 0, piloted: 0, sandboxes: 0 },
      unreachableSince: null,
    };
  }

  current(): ContainersView {
    return this.view;
  }

  /** Un passage du minuteur : Docker injoignable n'est retenté que toutes les 30 s. */
  async tick(): Promise<ContainersView> {
    const now = this.deps.clock.now().getTime();
    if (this.view.unreachableSince && now - this.lastAttempt < RETRY_MS) return this.view;
    return this.measure();
  }

  /** « Réessayer » : une mesure tout de suite. */
  async measure(): Promise<ContainersView> {
    this.lastAttempt = this.deps.clock.now().getTime();
    const view = await this.measureOnce();
    return this.publish(view);
  }

  private async measureOnce(): Promise<ContainersView> {
    const now = this.deps.clock.now();
    const piloted = await this.deps.pilots.list().catch(() => []);
    const pilotedView = piloted.map((turn) => ({ ...turn, cpuLimit: null, memoryLimit: null }));
    let samples: SandboxSample[];
    try {
      samples = await this.deps.probe.list();
    } catch {
      // Docker ne répond pas : les dernières mesures restent, datées
      return { ...this.view, piloted: pilotedView, unreachableSince: this.view.unreachableSince ?? now };
    }
    const sessions = await this.deps.sandboxedSessions().catch(() => []);
    const services = samples.filter(({ service }) => service !== null);
    const sandboxes = samples
      .filter(({ service }) => service === null)
      .map((sample): SandboxView => {
        const session = sessions.find(({ key }) => key === sample.key);
        return {
          cpu: sample.cpu,
          cpuLimit: this.deps.limits.cpus,
          memory: sample.memory,
          memoryLimit: this.deps.limits.memory,
          name: sample.name,
          project: session?.project ?? null,
          services: services
            .filter(({ key }) => key === sample.key)
            .map(({ cpu, memory, service, since }) => ({
              cpu,
              cpuLimit: this.deps.serviceLimits.cpus,
              image: service?.image ?? '',
              memory,
              memoryLimit: this.deps.serviceLimits.memory,
              name: service?.name ?? '',
              since,
              state: service?.state ?? 'ready',
            })),
          sessionId: session?.sessionId ?? null,
          since: sample.since,
          title: session?.title ?? sample.name,
        };
      });
    // Les services de données pèsent sur le poste comme leur bac à sable
    const usages: Usage[] = [...sandboxes, ...sandboxes.flatMap((sandbox) => sandbox.services), ...pilotedView];
    return {
      hostCpus: this.deps.hostCpus,
      measuredAt: now,
      piloted: pilotedView,
      sandboxes,
      totals: {
        cpu: usages.reduce((total, usage) => total + usage.cpu, 0),
        memory: usages.reduce((total, usage) => total + usage.memory, 0),
        piloted: pilotedView.length,
        sandboxes: sandboxes.length,
      },
      unreachableSince: null,
    };
  }

  private publish(view: ContainersView): ContainersView {
    this.view = view;
    this.deps.events.containersChanged(view);
    return view;
  }
}
