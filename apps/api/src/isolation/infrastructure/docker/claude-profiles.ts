import { access, readFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import type { ClaudeProfiles } from '../../application/isolation.service.ts';

/** Compte d'un profil : `.claude.json` du profil, ou celui du dossier personnel pour le profil ~/.claude. */
async function accountOf(profile: string): Promise<null | string> {
  const candidates = [join(profile, '.claude.json')];
  if (basename(profile) === '.claude') candidates.push(join(dirname(profile), '.claude.json'));
  for (const file of candidates) {
    try {
      const text = await readFile(file, 'utf8');
      const parsed = JSON.parse(text) as { oauthAccount?: { emailAddress?: unknown } };
      const email = parsed.oauthAccount?.emailAddress;
      if (typeof email === 'string') return email;
    } catch {
      // fichier absent ou illisible : le suivant
    }
  }
  return null;
}

const exists = (path: string) =>
  access(path).then(
    () => true,
    () => false,
  );

/** Profils Claude Code surveillés du poste : l'accès d'un profil à son abonnement est son `.credentials.json`. */
export class FileClaudeProfiles implements ClaudeProfiles {
  constructor(private readonly profilesOf: () => Promise<{ label: string; path: string }[]>) {}

  profiles(): Promise<{ label: string; path: string }[]> {
    return this.profilesOf();
  }

  async account(profile: string): Promise<{ account: null | string; credentials: null | string }> {
    const credentials = join(profile, '.credentials.json');
    const present = await exists(credentials);
    return { account: await accountOf(profile), credentials: present ? credentials : null };
  }

  exists(path: string): Promise<boolean> {
    return exists(path);
  }
}
