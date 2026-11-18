import type { SessionDto } from '@bosco/domain';
import type { SessionView } from '../../application/session.service.ts';

/** Vue d'une session telle que l'API la renvoie : le contrat partagé avec le web, dates en ISO 8601. */
export function presentSession(view: SessionView): SessionDto {
  // Le dossier hors projet ne sert qu'à la répartition de l'Usage : le web lit projectPath
  const shown: Omit<SessionView, 'folder'> & Partial<Pick<SessionView, 'folder'>> = { ...view };
  delete shown.folder;
  return {
    ...shown,
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
        }
      : null,
  };
}
