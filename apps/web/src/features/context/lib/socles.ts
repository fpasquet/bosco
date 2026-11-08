import type { SocleDto } from '@bosco/domain';

/** Socles qui reçoivent les décisions de celui-ci : lui-même et ceux qui en héritent, même indirectement. */
function family(id: number, socles: readonly SocleDto[]): SocleDto[] {
  const found = new Map<number, SocleDto>();
  const visit = (current: number) => {
    for (const socle of socles)
      if ((socle.id === current || socle.inherits === current) && !found.has(socle.id)) {
        found.set(socle.id, socle);
        visit(socle.id);
      }
  };
  visit(id);
  return [...found.values()];
}

/**
 * Dépôts dont les prochains agents sont touchés par un changement du socle (CA-CONT-58) : ceux où il s'applique, et
 * ceux des socles qui en héritent ; pour un socle modifié, avant comme après le changement.
 */
export function concernedRepositories(
  id: number,
  socles: readonly SocleDto[],
  after: null | { repositories: string[]; scope: 'global' | 'shared' } = null,
  everywhere: readonly string[] = [],
): string[] {
  const names = new Set(family(id, socles).flatMap(({ applied }) => applied));
  if (after) for (const name of after.scope === 'global' ? everywhere : after.repositories) names.add(name);
  return [...names].toSorted((a, b) => a.localeCompare(b, 'fr'));
}
