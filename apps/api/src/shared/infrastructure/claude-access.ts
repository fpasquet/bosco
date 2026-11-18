// Accès d'un profil à son abonnement, lu sur le disque. Le jeton longue durée ne sort d'ici que vers l'environnement d'un
// tour : jamais dans un journal, une erreur ou une réponse.
import { readFileSync } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProfileAccess } from '../domain/profile-access.ts';

/** Pourquoi un fichier de jeton ne sert pas ; null s'il se lit et n'est pas vide. Le jeton n'est pas gardé. */
export async function tokenFileProblem(file: string): Promise<null | string> {
  try {
    const text = await readFile(file, 'utf8');
    return text.trim() ? null : 'Le fichier du jeton est vide.';
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : null;
    return code === 'ENOENT' ? 'Le fichier du jeton est introuvable.' : 'Le fichier du jeton ne se lit pas.';
  }
}

/** Un jeton déclaré l'emporte sur la connexion du profil ; sans lui, la connexion (`.credentials.json`). */
export async function profileAccess(profile: string, tokenFile: null | string): Promise<ProfileAccess> {
  if (tokenFile) {
    const problem = await tokenFileProblem(tokenFile);
    return problem ? { kind: 'none', problem, tokenFile } : { kind: 'token', tokenFile };
  }
  const credentials = join(profile, '.credentials.json');
  const connected = await access(credentials).then(
    () => true,
    () => false,
  );
  return connected ? { kind: 'login', credentials } : { kind: 'none', problem: null, tokenFile: null };
}

/** Le jeton, lu au lancement d'un tour ; null s'il ne se lit plus ou si le fichier est vide. */
export function readToken(file: string): null | string {
  try {
    return readFileSync(file, 'utf8').trim() || null;
  } catch {
    return null;
  }
}
