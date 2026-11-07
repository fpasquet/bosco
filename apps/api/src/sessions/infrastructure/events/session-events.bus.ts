import { BehaviorSubject, Subject } from 'rxjs';
import type { SessionEvents } from '../../application/ports.ts';
import type { SessionView } from '../../application/session.service.ts';

/** Bus en mémoire des changements de sessions, que le flux en direct relaie (DT-06). */
/** Avancement de la première lecture de l'historique : transcripts lus sur le total à lire (E1e). */
export interface ImportProgress {
  read: number;
  total: number;
}

export class SessionEventsBus implements SessionEvents {
  readonly changes = new Subject<SessionView>();
  /** Dernier avancement connu, rejoué à chaque nouvel abonné ; null hors lecture */
  readonly importProgress = new BehaviorSubject<ImportProgress | null>(null);

  sessionChanged(session: SessionView): void {
    this.changes.next(session);
  }
}
