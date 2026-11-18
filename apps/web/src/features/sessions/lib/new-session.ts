import type { GroupDto, PilotOptionsDto, SessionDto } from '@bosco/domain';

export type OptionProject = PilotOptionsDto['projects'][number];

/**
 * Ce que propose le champ « Projets » (E16a) : d'abord les groupes qui ont des projets, « Tous les projets » excepté,
 * puis les projets pas encore choisis, les plus récemment ajoutés d'abord.
 */
export function projectsOffer(
  groups: readonly GroupDto[],
  projects: readonly OptionProject[],
  chosen: readonly string[],
): { groups: GroupDto[]; projects: OptionProject[] } {
  return {
    groups: groups.filter((group) => !group.system && group.projects.length > 0),
    projects: projects.filter(({ root }) => !chosen.includes(root)).toSorted((a, b) => b.id - a.id),
  };
}

/** Projets d'un groupe, dans son ordre : le principal en tête ; ceux que Bosco ne connaît plus sont laissés. */
export function groupProjects(group: GroupDto, projects: readonly OptionProject[]): string[] {
  return group.projects.flatMap(({ id }) => {
    const found = projects.find((project) => project.id === id);
    return found ? [found.root] : [];
  });
}

/** Le projet choisi devient le principal : il passe en tête, les autres gardent leur ordre (CA-SESS-133). */
export function withPrincipal(chosen: readonly string[], root: string): string[] {
  return [root, ...chosen.filter((candidate) => candidate !== root)];
}

/** Domaines que joint le bac à sable : la liste générale et ceux de chacun des projets, une fois chacun (CA-SESS-137). */
export function sandboxDomains(general: readonly string[], projects: readonly OptionProject[]): string[] {
  return [...new Set([...general, ...projects.flatMap(({ domains }) => domains)])];
}

/** Une session du terminal encore vivante dans ce dossier : deux agents y modifieraient les mêmes fichiers. */
export function openIn(sessions: readonly SessionDto[], root: string): null | SessionDto {
  return (
    sessions.find(
      (session) =>
        session.project?.root === root &&
        !session.pilot &&
        (session.openInTerminal || session.state === 'running' || session.state === 'waiting'),
    ) ?? null
  );
}

/** « creneaux et site-clubs », « a, b et c » */
export function namesList(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} et ${names.at(-1)}`;
}
