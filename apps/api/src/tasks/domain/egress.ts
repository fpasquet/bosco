/** Domaines toujours autorisés, nécessaires à Claude Code et aux installations : ils ne se retirent pas (E11b). */
export const LOCKED_DOMAINS = [
  'api.anthropic.com',
  'claude.ai',
  'platform.claude.com',
  'registry.npmjs.org',
  'registry.yarnpkg.com',
] as const;

/** « *.github.com » couvre les sous-domaines ; un nom simple, lui seul (RF-CONT-07). */
export function allows(domains: readonly string[], host: string): boolean {
  const name = host.toLowerCase().replace(/\.$/, '');
  return domains.some((domain) => {
    const rule = domain.toLowerCase();
    return rule.startsWith('*.') ? name.endsWith(rule.slice(1)) : name === rule;
  });
}

/** Un domaine ajouté : un nom, ou « *. » suivi d'un nom ; sans protocole, chemin ni port. */
export function isDomain(value: string): boolean {
  return /^(\*\.)?([a-z0-9-]+\.)+[a-z]{2,}$/i.test(value.trim());
}

/** Connexion refusée par le proxy d'une tâche : gardée une fois par tâche et par domaine, à l'heure du dernier essai. */
export interface EgressRefusal {
  at: Date;
  host: string;
  taskId: number;
}
