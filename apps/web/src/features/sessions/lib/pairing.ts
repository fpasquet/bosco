/** Les 6 chiffres d'un code d'appairage, sans les espaces que la personne a pu saisir. */
export function pairingDigits(value: string): null | string {
  const digits = value.replaceAll(/\s/g, '');
  return /^\d{6}$/.test(digits) ? digits : null;
}

/**
 * Lien du QR code d'appairage (E4c) : la page d'appairage du téléphone, avec le code tant qu'il vaut. Scanné, il ouvre
 * la page avec le code rempli ; sans code valable, il ouvre seulement l'adresse.
 */
export function pairingLink(url: string, code: null | string): string {
  const base = url.endsWith('/') ? url.slice(0, -1) : url;
  return code ? `${base}/pair?code=${encodeURIComponent(code)}` : base;
}
