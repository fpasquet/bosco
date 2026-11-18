// Bacs à sable factices des scénarios (BOSCO_TEST=1) : ni Docker ni git, une copie par projet sans rien copier. Le tour tourne sur le poste avec le Claude
// factice, ses conversations dans le profil des bacs à sable ; le vrai bac à sable se vérifie sur le poste.
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Sandboxes, SandboxState, StartedSandbox } from '../../application/pilot.service.ts';
import { SandboxError } from '../../domain/sandbox.ts';

/** Services de données que le fichier Compose d'un projet donnerait, lus sans Docker */
export type DataServicesReader = (projectDir: string) => Promise<{ image: string; name: string }[]>;

export class ScriptedSandboxes implements Sandboxes {
  readonly profile: string;
  /** Indisponibilité simulée par les scénarios */
  unavailableReason: null | string = null;
  private readonly states = new Map<string, SandboxState>();

  constructor(
    root: string,
    private readonly dataServices: DataServicesReader = () => Promise.resolve([]),
  ) {
    this.profile = join(root, 'profile');
  }

  unavailable(): Promise<null | string> {
    return Promise.resolve(this.unavailableReason);
  }

  currentBranch(): Promise<null | string> {
    return Promise.resolve('main');
  }

  async prepare(input: {
    projects: readonly { startBranch: null | string }[];
    sessionId: string;
  }): Promise<{ base: string; from: string }[]> {
    await mkdir(join(this.profile, 'projects'), { recursive: true });
    this.states.set(input.sessionId, 'stopped');
    return input.projects.map(({ startBranch }) => ({ base: 'scripted-base', from: startBranch ?? 'main' }));
  }

  /** Trois fichiers modifiés du poste, non copiés, dans chaque projet */
  uncommitted(): Promise<null | number> {
    return Promise.resolve(3);
  }

  /** Seule la copie du projet principal a du travail : les autres projets restent sans changement */
  work(input: { copy: number }): Promise<number> {
    return Promise.resolve(input.copy === 0 ? 2 : 0);
  }

  /** Le tour tourne sur le poste ; les services de données du fichier Compose du projet se disent prêts */
  async ensure(sessionId: string, projectRoots: readonly string[]): Promise<StartedSandbox> {
    if (this.states.get(sessionId) === 'missing')
      throw new SandboxError('sandboxRemoved', 'La copie du projet de ce bac à sable a disparu.');
    this.states.set(sessionId, 'running');
    const services = await this.dataServices(projectRoots[0] ?? '');
    return {
      launch: null,
      services: { error: null, services: services.map((service) => ({ ...service, error: null, state: 'ready' })) },
    };
  }

  state(sessionId: string): Promise<SandboxState> {
    return Promise.resolve(this.states.get(sessionId) ?? 'missing');
  }

  stop(sessionId: string): Promise<void> {
    this.states.set(sessionId, 'stopped');
    return Promise.resolve();
  }

  remove(sessionId: string): Promise<void> {
    this.states.set(sessionId, 'missing');
    return Promise.resolve();
  }

  retrieve(input: { branch: string }): Promise<string> {
    return Promise.resolve(input.branch);
  }

  refusals(): Promise<{ at: Date; host: string }[]> {
    return Promise.resolve([{ at: new Date('2026-11-06T15:08:00Z'), host: 'raw.githubusercontent.com' }]);
  }
}
