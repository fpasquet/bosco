import type { SessionDto } from '@bosco/domain';

const CLOCK = new Intl.DateTimeFormat('fr', { hour: '2-digit', minute: '2-digit' });

/**
 * Activité de la source des bacs à sable : ses bacs à sable encore présents et l'heure du dernier tour
 * (« 1 bac à sable · dernier tour à 15:12 ») ; null tant qu'aucune session n'y a tourné.
 */
export function sandboxActivity(sessions: SessionDto[]): null | string {
  if (sessions.length === 0) return null;
  const kept = sessions.filter((session) => session.pilot?.sandbox && !session.pilot.sandbox.removed).length;
  const last = Math.max(...sessions.map((session) => new Date(session.lastEventAt).getTime()));
  const count = `${kept} ${kept > 1 ? 'bacs à sable' : 'bac à sable'}`;
  return `${count} · dernier tour à ${CLOCK.format(new Date(last))}`;
}
