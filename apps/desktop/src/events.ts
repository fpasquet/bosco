// Flux en direct du service (GET /api/events) suivi par le processus principal : les sessions, pour la barre système,
// et les notifications, montrées en natif (CA-APPS-02, CA-APPS-03). Repris s'il tombe.
import type { NotificationDto, SessionDto } from '@bosco/domain';

export interface LiveListener {
  notified(notification: NotificationDto, inApp: boolean): void;
  sessions(sessions: Map<string, SessionDto>): void;
}

type Event = { data: unknown; type: string };

/** Événements d'un morceau de flux SSE ; le reste incomplet est rendu pour le morceau suivant. */
export function parseEvents(buffer: string): { events: Event[]; rest: string } {
  const events: Event[] = [];
  let rest = buffer;
  let end = rest.indexOf('\n\n');
  while (end >= 0) {
    const block = rest.slice(0, end);
    rest = rest.slice(end + 2);
    const type = /^event: (.*)$/m.exec(block)?.[1] ?? 'message';
    const data = block
      .split('\n')
      .filter((line) => line.startsWith('data: '))
      .map((line) => line.slice(6))
      .join('\n');
    if (data) events.push({ type, data: JSON.parse(data) as unknown });
    end = rest.indexOf('\n\n');
  }
  return { events, rest };
}

export class LiveEvents {
  private readonly sessions = new Map<string, SessionDto>();
  private readonly controller = new AbortController();

  constructor(
    private readonly baseUrl: string,
    private readonly listener: LiveListener,
  ) {}

  start(): void {
    void this.loop();
  }

  stop(): void {
    this.controller.abort();
  }

  apply(event: Event): void {
    if (event.type === 'sessions.snapshot') {
      const { sessions } = event.data as { sessions: SessionDto[] };
      this.sessions.clear();
      for (const session of sessions) this.sessions.set(session.id, session);
      this.listener.sessions(this.sessions);
    } else if (event.type === 'session.updated') {
      const { session } = event.data as { session: SessionDto };
      this.sessions.set(session.id, session);
      this.listener.sessions(this.sessions);
    } else if (event.type === 'notification.created') {
      const { inApp, notification } = event.data as { inApp: boolean; notification: NotificationDto };
      this.listener.notified(notification, inApp);
    }
  }

  private async loop(): Promise<void> {
    while (!this.controller.signal.aborted) {
      try {
        const response = await fetch(`${this.baseUrl}/api/events`, { signal: this.controller.signal });
        if (!response.body) throw new Error('no stream');
        const decoder = new TextDecoder();
        let buffer = '';
        for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
          const parsed = parseEvents(buffer + decoder.decode(chunk, { stream: true }));
          buffer = parsed.rest;
          for (const event of parsed.events) this.apply(event);
        }
      } catch {
        // service redémarré : on reprend
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
