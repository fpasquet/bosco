import type { SessionDto } from '@bosco/domain';
import type { SessionView } from '../../application/session.service.ts';

/** Vue d'une session telle que l'API la renvoie : le contrat partagé avec le web, dates en ISO 8601. */
export function presentSession(view: SessionView): SessionDto {
  return {
    ...view,
    lastEventAt: view.lastEventAt.toISOString(),
    startedAt: view.startedAt.toISOString(),
    waiting: view.waiting ? { ...view.waiting, since: view.waiting.since.toISOString() } : null,
    pilot: view.pilot
      ? {
          ...view.pilot,
          sandbox: view.pilot.sandbox && {
            ...view.pilot.sandbox,
            copies: view.pilot.sandbox.copies.map((copy) => ({
              ...copy,
              retrievedAt: copy.retrievedAt?.toISOString() ?? null,
            })),
            retrievedAt: view.pilot.sandbox.retrievedAt?.toISOString() ?? null,
            stopsAt: view.pilot.sandbox.stopsAt.toISOString(),
          },
          since: view.pilot.since.toISOString(),
          suspended: view.pilot.suspended && { ...view.pilot.suspended, at: view.pilot.suspended.at.toISOString() },
        }
      : null,
  };
}
