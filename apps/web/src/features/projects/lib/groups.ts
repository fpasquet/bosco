import type { GroupDto } from '@bosco/domain';

export const projectsLabel = (count: number) => (count > 1 ? `${count} projets` : `${count} projet`);

/** Une consigne par ligne non vide. */
export function instructionLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Consignes avec une clé à chacune, une consigne répétée gardant la sienne. */
export function keyedLines(text: string): { key: string; line: string }[] {
  const seen = new Map<string, number>();
  return instructionLines(text).map((line) => {
    const count = (seen.get(line) ?? 0) + 1;
    seen.set(line, count);
    return { key: `${line}#${count}`, line };
  });
}

/** Groupes de la personne qui réunissent ce projet, « Tous les projets » à part. */
export function groupsOfProject(groups: readonly GroupDto[], project: number): GroupDto[] {
  return groups.filter((group) => !group.system && group.projects.some(({ id }) => id === project));
}

/** Projets touchés quand les projets d'un groupe changent : ceux qui entrent et ceux qui sortent. */
export function touchedProjects(
  before: readonly { id: number; name: string }[],
  after: readonly { id: number; name: string }[],
): string[] {
  const kept = (list: readonly { id: number }[], id: number) => list.some((project) => project.id === id);
  return [...after.filter(({ id }) => !kept(before, id)), ...before.filter(({ id }) => !kept(after, id))].map(
    ({ name }) => name,
  );
}

/**
 * Ce que lit un agent du projet principal du groupe, dans l'ordre : « Tous les projets », chacun de ses groupes, puis
 * ses décisions, qui l'emportent.
 */
export function arrivalOrder(
  group: GroupDto,
  groups: readonly GroupDto[],
): { current: boolean; lines: number; name: string }[] {
  const principal = group.projects[0];
  const all = groups.find((candidate) => candidate.system);
  const own = principal ? groupsOfProject(groups, principal.id) : [];
  const chain = [
    ...(all ? [all] : []),
    ...(own.some(({ id }) => id === group.id) || group.system ? [] : [group]),
    ...own,
  ];
  return chain.map((candidate) => ({
    name: candidate.name,
    current: candidate.id === group.id,
    lines: instructionLines(candidate.instructions).length,
  }));
}
