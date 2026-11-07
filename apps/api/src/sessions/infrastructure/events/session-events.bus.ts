import { Subject } from 'rxjs';
import type { SessionEvents } from '../../application/ports.ts';
import type { SessionView } from '../../application/session.service.ts';

/** Bus en mémoire des changements de sessions, que le flux en direct relaie (DT-06). */
export class SessionEventsBus implements SessionEvents {
  readonly changes = new Subject<SessionView>();

  sessionChanged(session: SessionView): void {
    this.changes.next(session);
  }
}
