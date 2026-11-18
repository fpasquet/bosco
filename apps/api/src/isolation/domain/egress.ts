import { allowedHosts, harnessHosts } from 'ai-sdk-harness-network';
import { isDomainName } from '../../shared/domain/domain-name.ts';

/** Connexion à l'abonnement Claude depuis le bac à sable, que le paquet ne compte pas parmi les hôtes de Claude Code. */
const CLAUDE_SIGN_IN = ['claude.ai', 'platform.claude.com'];

/** Registre de Yarn seul : la liste de confiance du paquet y ajoute repo.yarnpkg.com, que Bosco n'a jamais verrouillé. */
const YARN_REGISTRY = ['registry.yarnpkg.com'];

/** Domaines toujours autorisés, nécessaires à Claude Code et aux installations : ils ne se retirent pas. */
export const LOCKED_DOMAINS: readonly string[] = allowedHosts(
  harnessHosts('claude-code', { install: true }),
  CLAUDE_SIGN_IN,
  YARN_REGISTRY,
);

/** « *.github.com » couvre les sous-domaines ; un nom simple, lui seul. */
export function allows(domains: readonly string[], host: string): boolean {
  const name = host.toLowerCase().replace(/\.$/, '');
  return domains.some((domain) => {
    const rule = domain.toLowerCase();
    return rule.startsWith('*.') ? name.endsWith(rule.slice(1)) : name === rule;
  });
}

/** Un domaine ajouté : un nom, ou « *. » suivi d'un nom ; sans protocole, chemin ni port. */
export const isDomain = isDomainName;
