import { DomainError } from '../../shared/domain/domain-error.ts';

/** Global : tous les dépôts ; partagé : les seuls dépôts qui l'héritent (RF-CONT-03). */
export type SocleScope = 'global' | 'shared';

export interface SocleSnapshot {
  id: number;
  /** Socle dont il reçoit les décisions, en plus des siennes */
  inherits: null | number;
  name: string;
  repositories: string[];
  scope: SocleScope;
}

export class SocleError extends DomainError {}

/** Un socle ne peut pas hériter de lui-même, même indirectement (E14b, annotation 2). */
export function checkInheritance(id: number, inherits: null | number, socles: readonly SocleSnapshot[]): void {
  let current = inherits;
  const seen = new Set<number>();
  while (current !== null) {
    if (current === id || seen.has(current))
      throw new SocleError('socleLoop', 'Un socle ne peut pas hériter de lui-même, même indirectement.');
    seen.add(current);
    current = socles.find((socle) => socle.id === current)?.inherits ?? null;
  }
}

/** Socles qui s'appliquent à un dépôt, dans l'ordre où ils s'empilent : un socle avant ceux qui en héritent. */
export function soclesOf(repository: string, socles: readonly SocleSnapshot[]): SocleSnapshot[] {
  const applied = new Map<number, SocleSnapshot>();
  const add = (socle: SocleSnapshot, depth: number) => {
    if (depth > socles.length) return;
    const parent = socles.find((candidate) => candidate.id === socle.inherits);
    if (parent) add(parent, depth + 1);
    applied.set(socle.id, socle);
  };
  for (const socle of socles) if (socle.scope === 'global' || socle.repositories.includes(repository)) add(socle, 0);
  return [...applied.values()];
}
