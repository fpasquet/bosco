import type { Session } from '../domain/session.ts';
import type { Clock, SessionRepository } from './ports.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';

/** Cas d'usage des sessions : une méthode par intention. */
export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly clock: Clock,
  ) {}

  async askPermission(id: string): Promise<Session> {
    const session = await this.getSession(id);
    session.askPermission(this.clock.now());
    await this.sessionRepository.save(session);
    return session;
  }

  private async getSession(id: string): Promise<Session> {
    const session = await this.sessionRepository.find(id);
    if (!session) throw new DomainError('sessionNotFound', `Session ${id} not found`);
    return session;
  }
}
