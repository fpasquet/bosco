import type { SessionDto } from '@bosco/domain';
import type { SessionView } from '../../application/session.service.ts';

/** Vue d'une session telle que l'API la renvoie : le contrat partagé avec le web, dates en ISO 8601. */
export function presentSession(view: SessionView): SessionDto {
  return {
    ...view,
    lastEventAt: view.lastEventAt.toISOString(),
    startedAt: view.startedAt.toISOString(),
  };
}
