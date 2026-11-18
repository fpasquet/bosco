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
 * Une session à plusieurs projets ajoute les autres projets, avec le réglage qui lit leurs instructions (CA-SESS-140).
 */
export function resumeCommand(session: SessionDto, sources: readonly SourceDto[], home: string): null | string {
  // Une session pilotée par Bosco se reprend aussi dans un terminal entre deux tours (règle 9)
  const betweenTurns = !!session.pilot && !session.pilot.running;
  if (session.state !== 'ended' && !betweenTurns) return null;
  const source = sources.find((candidate) => candidate.id === session.sourceId);
  const others = session.pilot?.projects ?? [];
  const resume = [
    ...(others.length > 0 ? ['CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1'] : []),
    `claude --resume ${session.id}`,
    ...others.map((root) => `--add-dir ${displayPath(root, home)}`),
  ].join(' ');
  return !source || source.path.endsWith('/.claude')
    ? resume
    : `CLAUDE_CONFIG_DIR=${displayPath(source.path, home)} ${resume}`;
}

/** Fichiers modifiés par l'agent dans un projet de la session : sous sa racine, ou relatifs pour le principal. */
export function filesIn(session: SessionDto, root: string): SessionDto['changedFiles'] {
  const others = session.addedProjects.map((project) => project.root);
  const principal = root === session.project?.root || (!session.project && others.length === 0);
  return session.changedFiles.filter(({ path }) => {
    if (path.startsWith(`${root}/`)) return true;
    // Un chemin relatif se lit depuis le dossier de travail, celui du projet principal
    return principal && !path.startsWith('/');
  });
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
/**
 * Profil d'une session du terminal encore ouverte, sans suivi en direct : rien ne signale qu'elle attend, Bosco
 * propose de l'installer. null pour une session pilotée, terminée, ou d'un profil déjà suivi.
 */
export function missingLiveTracking(session: SessionDto, sources: readonly SourceDto[]): null | SourceDto {
  if (session.pilot !== null || session.state === 'ended') return null;
  const source = sources.find((candidate) => candidate.id === session.sourceId);
  return source && !source.liveTracking && !source.managed ? source : null;
}

export function profileOf(session: SessionDto, sources: readonly SourceDto[]): null | string {
  return sources.find((candidate) => candidate.id === session.sourceId)?.label ?? null;
}
