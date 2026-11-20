import { isAllowedHost } from 'ai-sdk-harness-network';

/**
 * Un domaine autorisé : un nom, ou « *. » suivi d'un nom ; sans protocole, chemin ni port. Le paquet donne la forme
 * d'un hôte ; Bosco demande en plus un nom à deux étiquettes au moins, fini par une extension en lettres.
 */
export function isDomainName(value: string): boolean {
  const name = value.trim();
  return isAllowedHost(name) && /\.[a-z]{2,}$/i.test(name);
}
