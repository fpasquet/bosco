// Bacs à sable factices des scénarios (BOSCO_TEST=1) : ni Docker ni git. Le tour tourne sur le poste avec le Claude
// factice, ses conversations dans le profil des bacs à sable ; le vrai bac à sable se vérifie sur le poste.
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Sandboxes, SandboxState } from '../../application/pilot.service.ts';

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

  async prepare(input: { sessionId: string; startBranch: null | string }): Promise<{ base: string; from: string }> {
    await mkdir(join(this.profile, 'projects'), { recursive: true });
    this.states.set(input.sessionId, 'stopped');
    return { base: 'scripted-base', from: input.startBranch ?? 'main' };
  }

  ensure(sessionId: string): Promise<null> {
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
