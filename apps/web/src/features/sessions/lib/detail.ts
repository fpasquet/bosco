import type { SessionDto, SourceDto } from '@bosco/domain';
import { displayPath } from './format';

const CLOCK = new Intl.DateTimeFormat('fr', { hour: '2-digit', minute: '2-digit' });

/** « 14:36 » */
export function clockOf(iso: string): string {
  return CLOCK.format(new Date(iso));
}

/**
 * Commande qui reprend une session close (RF-SESS-09) : claude --resume avec l'identifiant complet, précédée du
 * dossier de configuration pour un autre profil que celui par défaut (CA-SESS-42). Une session ouverte n'en a pas.
 */
export function resumeCommand(session: SessionDto, sources: readonly SourceDto[], home: string): null | string {
  if (session.state !== 'ended') return null;
  const source = sources.find((candidate) => candidate.id === session.sourceId);
  const resume = `claude --resume ${session.id}`;
  return !source || source.path.endsWith('/.claude')
    ? resume
    : `CLAUDE_CONFIG_DIR=${displayPath(source.path, home)} ${resume}`;
}

/** Part des tokens lus depuis le cache plutôt que recalculés : « 64 % ». */
export function cacheShare(usage: SessionDto['usage']): number {
  const read = usage.input + usage.cacheRead + usage.cacheCreation;
  return read === 0 ? 0 : Math.round((usage.cacheRead / read) * 100);
}

/** Durée de la session : jusqu'à maintenant tant qu'elle est ouverte, jusqu'à son dernier événement ensuite. */
export function durationEnd(session: SessionDto, now: Date): Date {
  return session.state === 'ended' || session.state === 'inactive' ? new Date(session.lastEventAt) : now;
}

/** Profil d'une session, par son nom court (« pro », « perso »). */
export function profileOf(session: SessionDto, sources: readonly SourceDto[]): null | string {
  return sources.find((candidate) => candidate.id === session.sourceId)?.label ?? null;
}
