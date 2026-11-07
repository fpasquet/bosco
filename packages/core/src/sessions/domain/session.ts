import { DomainError } from '../../shared/domain/domain-error.ts';

export type SessionState = 'idle' | 'running' | 'waiting';

/** Une session Claude Code : un seul état à la fois, une seule autorisation en attente. */
export class Session {
  private constructor(
    readonly id: string,
    private state: SessionState,
    private waitingSince: Date | null,
  ) {}

  static discover(id: string): Session {
    return new Session(id, 'running', null);
  }

  get currentState(): SessionState {
    return this.state;
  }

  askPermission(at: Date): void {
    if (this.state === 'waiting')
      throw new DomainError('permissionAlreadyPending', `Session ${this.id} already waits for an answer`);
    this.state = 'waiting';
    this.waitingSince = at;
  }

  answerPermission(): void {
    if (this.state !== 'waiting')
      throw new DomainError('noPendingPermission', `Session ${this.id} has no pending permission`);
    this.state = 'running';
    this.waitingSince = null;
  }

  waitedFor(now: Date): number {
    return this.waitingSince ? now.getTime() - this.waitingSince.getTime() : 0;
  }
}
