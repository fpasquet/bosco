// Lien du QR code d'appairage (E4c, CA-APPS-05) : l'adresse du poste, le code et l'empreinte du certificat.

export interface Pairing {
  code: null | string;
  /** Empreinte SHA-256 du certificat du poste (« 9F:3A:… ») ; sans elle, l'application ne peut pas lui faire confiance */
  fingerprint: null | string;
  /** Adresse du poste sur le réseau local (« https://192.168.1.24:4310 ») */
  url: string;
}

/** Lit le lien du QR code ; null s'il ne vient pas de Bosco. */
export function parsePairing(link: string): null | Pairing {
  let parsed: URL;
  try {
    parsed = new URL(link.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || !parsed.pathname.startsWith('/pair')) return null;
  const fingerprint = parsed.searchParams.get('fp');
  return {
    code: parsed.searchParams.get('code'),
    fingerprint: fingerprint && /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/i.test(fingerprint) ? fingerprint.toUpperCase() : null,
    url: parsed.origin,
  };
}

/** Empreinte raccourcie pour l'écran (« 9F:3A:…:C2 »). */
export function shortFingerprint(fingerprint: string): string {
  const parts = fingerprint.split(':');
  return parts.length > 3 ? `${parts[0]}:${parts[1]}:…:${parts.at(-1)}` : fingerprint;
}

/** « 482913 » → « 482 913 » */
export function spacedCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}
