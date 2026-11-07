import { Controller, Inject, type MessageEvent, Sse } from '@nestjs/common';
import {
  concatWith,
  defer,
  finalize,
  from,
  interval,
  map,
  merge,
  type Observable,
  ReplaySubject,
  switchMap,
} from 'rxjs';
import type { SessionService, SessionView } from '../../application/session.service.ts';
import type { SessionEventsBus } from '../../infrastructure/events/session-events.bus.ts';
import { SESSION_EVENTS, SESSION_SERVICE } from '../../tokens.ts';

/** Un nouvel instantané à cet intervalle : une session sans événement passe Inactive à l'heure. */
const SNAPSHOT_INTERVAL_MS = 30_000;

@Controller('api')
export class EventsController {
  constructor(
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionService,
    @Inject(SESSION_EVENTS) private readonly bus: SessionEventsBus,
  ) {}

  /**
   * Flux en direct : un instantané des sessions, puis chaque changement, sur le même canal (DT-06). L'abonnement aux
   * changements précède la lecture de l'instantané, et ce qui arrive entre les deux est rejoué après lui : aucun
   * changement ne se perd. Une reconnexion reçoit un nouvel instantané.
   */
  @Sse('events')
  events(): Observable<MessageEvent> {
    return defer(() => {
      const pending = new ReplaySubject<SessionView>();
      const subscription = this.bus.changes.subscribe(pending);
      const first = from(this.sessionService.listSessions()).pipe(map(snapshotEvent));
      const changes = pending.pipe(map((session) => ({ type: 'session.updated', data: { session } })));
      const later = interval(SNAPSHOT_INTERVAL_MS).pipe(
        switchMap(() => from(this.sessionService.listSessions())),
        map(snapshotEvent),
      );
      // Avancement de la première lecture de l'historique (E1e), le dernier connu d'abord
      const progress = this.bus.importProgress.pipe(
        map((value) => ({ type: 'import.progress', data: { progress: value } })),
      );
      return merge(first.pipe(concatWith(changes)), later, progress).pipe(finalize(() => subscription.unsubscribe()));
    });
  }
}

function snapshotEvent(sessions: SessionView[]): MessageEvent {
  return { type: 'sessions.snapshot', data: { sessions } };
}
