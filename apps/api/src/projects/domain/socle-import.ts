import { ALL_PROJECTS } from './group.ts';

/** Un socle tel qu'il était gardé : global (tous les projets) ou partagé (ses projets, par leur nom). */
export interface RetiredSocle {
  id: number;
  /** Socle dont il recevait les décisions, en plus des siennes */
  inherits: null | number;
  name: string;
  projects: string[];
  scope: string;
}

/** Version courante d'une décision acceptée d'un socle. */
export interface RetiredSocleDecision {
  decision: string;
  id: number;
  socle: number;
  title: string;
}

export interface SocleImport {
  /** Instructions de « Tous les projets », venues des socles globaux */
  common: string;
  /** Un groupe par socle partagé, ses projets dans l'ordre du socle, puis ceux des socles qui en héritaient */
  groups: { instructions: string; name: string; projects: string[] }[];
}

const flat = (text: string) => text.replaceAll(/\s+/g, ' ').trim();

/** Une décision devient une consigne d'une ligne : sa décision, précédée de son titre quand elle ne le reprend pas. */
export function instructionOf({ decision, title }: { decision: string; title: string }): string {
  const body = flat(decision);
  const head = flat(title).replace(/\.$/, '');
  if (!body) return head;
  return body.toLocaleLowerCase('fr').startsWith(head.toLocaleLowerCase('fr')) ? body : `${head} : ${body}`;
}

/** Nom libre : celui du socle, numéroté quand un groupe le porte déjà. */
function freeName(name: string, taken: Set<string>): string {
  const key = (value: string) => value.toLocaleLowerCase('fr');
  const base = name.trim() || 'Socle';
  let candidate = base;
  let index = 1;
  while (taken.has(key(candidate))) {
    index += 1;
    candidate = `${base} (${index})`;
  }
  taken.add(key(candidate));
  return candidate;
}

/**
 * Reprise des socles en groupes, une fois : le socle commun donne les instructions de « Tous les projets », chaque
 * socle partagé un groupe dont les décisions acceptées, dans leur ordre, deviennent les instructions. Les projets d'un
 * socle qui en héritait rejoignent aussi le groupe parent ; un socle hérité par un socle global valait pour tous.
 */
export function groupsFromSocles(input: {
  /** Noms de tous les projets, pour un socle partagé dont héritait un socle global */
  allProjects: readonly string[];
  decisions: readonly RetiredSocleDecision[];
  socles: readonly RetiredSocle[];
  /** Noms déjà pris par des groupes */
  taken: readonly string[];
}): SocleImport {
  const { allProjects, decisions, socles } = input;
  const instructions = (socle: RetiredSocle) =>
    decisions
      .filter((decision) => decision.socle === socle.id)
      .toSorted((a, b) => a.id - b.id)
      .map(instructionOf)
      .join('\n');
  // Le socle lui-même et ceux qui en héritent, même indirectement
  const heirs = (root: RetiredSocle): RetiredSocle[] => {
    const found = new Map<number, RetiredSocle>([[root.id, root]]);
    for (let grown = true; grown;) {
      grown = false;
      for (const socle of socles)
        if (!found.has(socle.id) && socle.inherits !== null && found.has(socle.inherits)) {
          found.set(socle.id, socle);
          grown = true;
        }
    }
    return [...found.values()];
  };
  const taken = new Set([ALL_PROJECTS, ...input.taken].map((name) => name.toLocaleLowerCase('fr')));
  const common = socles
    .filter((socle) => socle.scope === 'global')
    .map(instructions)
    .filter(Boolean)
    .join('\n');
  const groups = socles
    .filter((socle) => socle.scope !== 'global')
    .map((socle) => {
      const family = heirs(socle);
      const projects = family.some((heir) => heir.scope === 'global')
        ? allProjects
        : family.flatMap((heir) => heir.projects);
      return {
        name: freeName(socle.name, taken),
        instructions: instructions(socle),
        projects: [...new Set(projects)].filter((name) => allProjects.includes(name)),
      };
    });
  return { common, groups };
}
