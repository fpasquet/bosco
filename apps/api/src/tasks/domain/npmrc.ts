/** Registre npm déclaré dans un .npmrc : un scope (« @interne ») ou le registre par défaut, et son domaine. */
export interface NpmRegistry {
  host: string;
  scope: null | string;
}

/** Scope d'une clé de registre (« @interne:registry »), null pour « registry », undefined pour une autre clé. */
function scopeOf(key: string): null | string | undefined {
  if (key === 'registry') return null;
  return key.endsWith(':registry') ? key.slice(0, -':registry'.length) : undefined;
}

function hostOf(value: string): null | string {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Registres d'un .npmrc (E11b), sans jamais lire ses jetons : les lignes `registry=…` et `@scope:registry=…`. Le
 * registre public par défaut n'y figure pas, il est déjà autorisé.
 */
export function npmRegistries(text: string): NpmRegistry[] {
  const found = new Map<string, NpmRegistry>();
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const separator = line.indexOf('=');
    if (line.startsWith('#') || line.startsWith(';') || separator < 0) continue;
    const scope = scopeOf(line.slice(0, separator).trim());
    const host = hostOf(line.slice(separator + 1).trim());
    if (scope === undefined || !host || host === 'registry.npmjs.org') continue;
    found.set(`${scope ?? ''} ${host}`, { host, scope });
  }
  return [...found.values()];
}
