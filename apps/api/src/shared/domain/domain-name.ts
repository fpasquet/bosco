/** Un domaine autorisé : un nom, ou « *. » suivi d'un nom ; sans protocole, chemin ni port. */
export function isDomainName(value: string): boolean {
  return /^(\*\.)?([a-z0-9-]+\.)+[a-z]{2,}$/i.test(value.trim());
}
