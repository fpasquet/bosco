// Bacs à sable factices des scénarios (BOSCO_TEST=1) : ni Docker ni git, une copie par projet sans rien copier. Le tour tourne sur le poste avec le Claude
// factice, ses conversations dans le profil des bacs à sable ; le vrai bac à sable se vérifie sur le poste.
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Sandboxes, SandboxState } from '../../application/pilot.service.ts';
import { SandboxError } from '../../domain/sandbox.ts';

export class ScriptedSandboxes implements Sandboxes {
  readonly profile: string;
  /** Indisponibilité simulée par les scénarios */
  unavailableReason: null | string = null;
  private readonly states = new Map<string, SandboxState>();

  constructor(root: string) {
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

  ensure(sessionId: string): Promise<null> {
    if (this.states.get(sessionId) === 'missing')
      return Promise.reject(new SandboxError('sandboxRemoved', 'La copie du projet de ce bac à sable a disparu.'));
    this.states.set(sessionId, 'running');
    return Promise.resolve(null);
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
