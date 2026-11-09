import type { Clock } from './ports.ts';
import type { TaskService, TaskView } from './task.service.ts';
import {
  type ContainerKind,
  type ContainerSample,
  LEFTOVER_CLEANUP_MS,
  LEFTOVER_GRACE_MS,
  UnknownContainer,
} from '../domain/containers.ts';
import { SERVICE_LIMITS } from '../domain/test-services.ts';
import { AGENT_LIMITS, RESERVED_MEMORY, type WorkerStatus } from './worker.service.ts';

/** Mesure toutes les 5 s (CA-CONT-70) ; quand Docker ne répond pas, nouvel essai toutes les 30 s (CA-CONT-82). */
export const MEASURE_MS = 5000;
export const RETRY_MS = 30_000;

/** Lignes du journal d'un service affichées par « Journal » (E19a). */
export const LOG_LINES = 300;

/** Docker, vu par Bosco : ses conteneurs (étiquetés `bosco.task`), leur consommation et les actions possibles. */
export interface ContainerProbe {
  /** Place prise sur le disque par ces conteneurs, en octets */
  diskOf(names: readonly string[]): Promise<number>;
  /** Conteneurs de Bosco, mesurés ; lève une erreur si Docker ne répond pas */
  list(): Promise<ContainerSample[]>;
  logs(name: string, lines: number): Promise<string>;
  remove(names: readonly string[]): Promise<void>;
  /** Redémarre sans recréer, puis attend la vérification d'état ; renvoie l'erreur, ou null une fois prêt (E19b) */
  restart(name: string, waitSeconds: number): Promise<null | string>;
}

/** Tours de sessions pilotées en cours, mesurés sur leurs processus (DT-35) */
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

export interface RunningService extends Usage {
  image: string;
  name: string;
  service: string;
  state: 'failed' | 'restarting' | 'running';
}

export interface RunningAgent extends Usage {
  name: string;
  repository: string;
  services: RunningService[];
  taskId: number;
  title: string;
}

export interface LeftoverContainer {
  image: string;
  kind: ContainerKind;
  name: string;
  running: boolean;
  service: null | string;
  task: null | { endedAt: Date; state: TaskView['state']; title: string };
  taskId: number;
}

export interface ContainersView {
  agents: RunningAgent[];
  capacity: { availableMemory: number; maxAgents: number; reservedMemory: number; running: number };
  hostCpus: number;
  leftovers: LeftoverContainer[];
  leftoversDisk: number;
  measuredAt: Date | null;
  nextCleanupAt: Date | null;
  piloted: {
    cpu: number;
    cpuLimit: null;
    memory: number;
    memoryLimit: null;
    sessionId: string;
    since: Date;
    title: string;
  }[];
  totals: { agents: number; cpu: number; memory: number; piloted: number; services: number };
  unreachableSince: Date | null;
}

export interface ContainersDeps {
  clock: Clock;
  events: ContainerEvents;
  hostCpus: number;
  pilots: PilotedTurnsProbe;
  probe: ContainerProbe;
  tasks: Pick<TaskService, 'list' | 'record'>;
  worker: { current(): WorkerStatus };
}

const GIGABYTE = 1024 ** 3;
const MEGABYTE = 1024 ** 2;

/** « 3,6 Go », « 412 Mo » */
export function sizeOf(bytes: number): string {
  if (bytes >= GIGABYTE) return `${(bytes / GIGABYTE).toFixed(1).replace('.', ',')} Go`;
  return `${Math.round(bytes / MEGABYTE)} Mo`;
}

/**
 * Conteneurs en cours (E19, E13d, RF-CONT-13, DT-35) : mesure ce que Bosco fait tourner, le range par tâche, garde le
 * pic de mémoire de chaque conteneur pour le journal de sa tâche, redémarre un service de test et supprime les
 * conteneurs restés après leur tâche. Seuls les conteneurs de Bosco et les tours pilotés sont vus.
 */
export class ContainersService {
  private view: ContainersView;
  private lastAttempt = 0;
  private measuring: null | Promise<ContainersView> = null;
  /** Redémarrages en cours ou en échec, par nom de conteneur (E19b) */
  private readonly restarts = new Map<string, 'failed' | 'restarting'>();
  /** Pic de mémoire de chaque conteneur d'une tâche en cours, par tâche puis par libellé (« agent », « database ») */
  private readonly peaks = new Map<number, Map<string, number>>();
  private lastSamples: ContainerSample[] = [];

  constructor(private readonly deps: ContainersDeps) {
    this.view = {
      agents: [],
      capacity: this.capacity(),
      hostCpus: deps.hostCpus,
      leftovers: [],
      leftoversDisk: 0,
      measuredAt: null,
      nextCleanupAt: null,
      piloted: [],
      totals: { agents: 0, cpu: 0, memory: 0, piloted: 0, services: 0 },
      unreachableSince: null,
    };
  }

  current(): ContainersView {
    return this.view;
  }

  /** Un passage du minuteur : mesure, sauf si Docker ne répond pas et que le dernier essai a moins de 30 s. */
  async tick(): Promise<ContainersView> {
    const now = this.deps.clock.now().getTime();
    if (this.view.unreachableSince && now - this.lastAttempt < RETRY_MS) return this.view;
    return this.measure();
  }

  /** Mesure tout de suite : « Réessayer » quand Docker ne répond pas (CA-CONT-82). */
  measure(): Promise<ContainersView> {
    this.measuring ??= this.measureOnce().finally(() => {
      this.measuring = null;
    });
    return this.measuring;
  }

  private async measureOnce(): Promise<ContainersView> {
    const now = this.deps.clock.now();
    this.lastAttempt = now.getTime();
    const [tasks, piloted] = await Promise.all([this.deps.tasks.list(), this.deps.pilots.list().catch(() => [])]);
    let samples: ContainerSample[];
    try {
      samples = await this.deps.probe.list();
    } catch {
      // Docker ne répond pas : les dernières mesures restent, datées, et le résumé le dit (CA-CONT-80, CA-CONT-81)
      return this.publish({
        ...this.view,
        capacity: this.capacity(),
        piloted: piloted.map((turn) => ({ ...turn, cpuLimit: null, memoryLimit: null })),
        unreachableSince: this.view.unreachableSince ?? now,
      });
    }
    this.lastSamples = samples;
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const running = samples.filter((sample) => this.isRunningTask(sample, byId.get(sample.taskId), now));
    const leftovers = samples.filter(
      (sample) => !running.includes(sample) && this.isLeftover(byId.get(sample.taskId), now),
    );
    await this.notePeaks(running, byId);
    const agents = this.agentsOf(running, byId);
    const pilotedView = piloted.map((turn) => ({ ...turn, cpuLimit: null, memoryLimit: null }));
    const services = agents.flatMap((agent) => agent.services);
    const usages: Usage[] = [...agents, ...services, ...pilotedView];
    return this.publish({
      agents,
      capacity: this.capacity(),
      hostCpus: this.deps.hostCpus,
      leftovers: leftovers.map((sample) => this.leftoverOf(sample, byId.get(sample.taskId))),
      leftoversDisk: leftovers.length > 0 ? await this.deps.probe.diskOf(leftovers.map(({ name }) => name)) : 0,
      measuredAt: now,
      nextCleanupAt: this.view.nextCleanupAt,
      piloted: pilotedView,
      totals: {
        agents: agents.length,
        cpu: usages.reduce((sum, usage) => sum + usage.cpu, 0),
        memory: usages.reduce((sum, usage) => sum + usage.memory, 0),
        piloted: pilotedView.length,
        services: services.length,
      },
      unreachableSince: null,
    });
  }

  /** Suppression des conteneurs restés, au démarrage puis toutes les heures (CA-CONT-84). */
  async cleanup(): Promise<void> {
    const now = this.deps.clock.now();
    this.view = { ...this.view, nextCleanupAt: new Date(now.getTime() + LEFTOVER_CLEANUP_MS) };
    await this.measure();
    if (this.view.leftovers.length > 0) await this.removeLeftovers();
    else this.publish(this.view);
  }

  /** « Supprimer » un conteneur resté, ou « Tout supprimer maintenant » (sans nom), sans confirmation (CA-CONT-84). */
  async removeLeftovers(name?: string): Promise<ContainersView> {
    const names = this.view.leftovers
      .map((leftover) => leftover.name)
      .filter((candidate) => !name || candidate === name);
    if (name && names.length === 0) throw new UnknownContainer(name);
    await this.deps.probe.remove(names);
    return this.measure();
  }

  /** Redémarre un service de test, sans le recréer ; le journal de sa tâche le note (E19b, CA-CONT-78, CA-CONT-79). */
  async restartService(name: string): Promise<ContainersView> {
    const service = this.view.agents
      .flatMap((agent) => agent.services.map((item) => ({ agent, item })))
      .find(({ item }) => item.name === name);
    if (!service) throw new UnknownContainer(name);
    this.restarts.set(name, 'restarting');
    this.publish(this.withServiceState(name, 'restarting'));
    const error = await this.deps.probe
      .restart(name, SERVICE_LIMITS.waitSeconds)
      .catch((reason: unknown) => (reason instanceof Error ? reason.message : String(reason)));
    const { taskId } = service.agent;
    if (error) {
      this.restarts.set(name, 'failed');
      await this.deps.tasks.record(taskId, 'Service en échec après redémarrage', `${service.item.service} : ${error}`);
    } else {
      this.restarts.delete(name);
      await this.deps.tasks.record(taskId, 'Service redémarré', service.item.service);
    }
    return this.measure();
  }

  /** Les 300 dernières lignes du journal d'un service de test (E19a, annotation 4). */
  async logs(name: string): Promise<string> {
    const known = this.view.agents.some((agent) => agent.services.some((service) => service.name === name));
    if (!known) throw new UnknownContainer(name);
    return this.deps.probe.logs(name, LOG_LINES);
  }

  private capacity(): ContainersView['capacity'] {
    const status = this.deps.worker.current();
    return {
      availableMemory: status.availableMemory,
      maxAgents: status.capacity,
      reservedMemory: RESERVED_MEMORY,
      running: status.running,
    };
  }

  private isRunningTask(sample: ContainerSample, task: TaskView | undefined, now: Date): boolean {
    if (!sample.running || !task) return false;
    if (task.state === 'running') return true;
    return now.getTime() - task.updatedAt.getTime() < LEFTOVER_GRACE_MS;
  }

  /** Tâche finie (ou disparue) depuis plus d'une minute : son conteneur est resté (CA-CONT-83). */
  private isLeftover(task: TaskView | undefined, now: Date): boolean {
    if (!task) return true;
    if (task.state === 'running') return false;
    return now.getTime() - task.updatedAt.getTime() >= LEFTOVER_GRACE_MS;
  }

  private agentsOf(samples: ContainerSample[], tasks: Map<number, TaskView>): RunningAgent[] {
    return samples
      .filter((sample) => sample.kind === 'agent')
      .map((agent) => {
        const task = tasks.get(agent.taskId);
        const services = samples
          .filter((sample) => sample.kind === 'service' && sample.taskId === agent.taskId)
          .map((sample) => ({
            cpu: sample.cpu,
            cpuLimit: SERVICE_LIMITS.cpus,
            image: sample.image,
            memory: sample.memory,
            memoryLimit: SERVICE_LIMITS.memory,
            name: sample.name,
            service: sample.service ?? sample.name,
            state: this.restarts.get(sample.name) ?? ('running' as const),
          }));
        return {
          cpu: agent.cpu,
          cpuLimit: AGENT_LIMITS.cpus,
          memory: agent.memory,
          memoryLimit: AGENT_LIMITS.memory,
          name: agent.name,
          repository: task?.repository.name ?? '',
          services,
          taskId: agent.taskId,
          title: task?.title ?? `T-${agent.taskId}`,
        };
      })
      .toSorted((a, b) => b.taskId - a.taskId);
  }

  private leftoverOf(sample: ContainerSample, task: TaskView | undefined): LeftoverContainer {
    return {
      image: sample.image,
      kind: sample.kind,
      name: sample.name,
      running: sample.running,
      service: sample.service,
      task: task ? { endedAt: task.updatedAt, state: task.state, title: task.title } : null,
      taskId: sample.taskId,
    };
  }

  /**
   * Garde le pic de mémoire de chaque conteneur d'une tâche en cours ; quand l'agent d'une tâche a disparu, note les
   * pics dans son journal : de quoi ajuster les plafonds (E13d, CA-TACH-82).
   */
  private async notePeaks(running: ContainerSample[], tasks: Map<number, TaskView>): Promise<void> {
    for (const sample of running) {
      if (sample.kind === 'proxy') continue;
      const label = sample.kind === 'agent' ? 'agent' : (sample.service ?? sample.name);
      const peaks = this.peaks.get(sample.taskId) ?? new Map<string, number>();
      peaks.set(label, Math.max(peaks.get(label) ?? 0, sample.memory));
      this.peaks.set(sample.taskId, peaks);
    }
    for (const [taskId, peaks] of this.peaks) {
      if (running.some((sample) => sample.taskId === taskId && sample.kind === 'agent')) continue;
      this.peaks.delete(taskId);
      if (!tasks.has(taskId)) continue;
      const detail = [...peaks].map(([label, bytes]) => `${label} ${sizeOf(bytes)}`).join(' · ');
      await this.deps.tasks.record(taskId, 'Pic de mémoire', detail).catch(() => undefined);
    }
  }

  private withServiceState(name: string, state: RunningService['state']): ContainersView {
    return {
      ...this.view,
      agents: this.view.agents.map((agent) => ({
        ...agent,
        services: agent.services.map((service) => (service.name === name ? { ...service, state } : service)),
      })),
    };
  }

  private publish(view: ContainersView): ContainersView {
    this.view = view;
    this.deps.events.containersChanged(view);
    return view;
  }
}
