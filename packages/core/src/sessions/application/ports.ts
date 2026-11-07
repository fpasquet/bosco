import type { Session } from '../domain/session.ts';

export interface SessionRepository {
  find(id: string): Promise<null | Session>;
  save(session: Session): Promise<void>;
}

export interface Clock {
  now(): Date;
}
