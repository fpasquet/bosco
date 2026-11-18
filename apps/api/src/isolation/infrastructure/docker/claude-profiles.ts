import { access, readFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import type { ProfileAccess } from '../../../shared/domain/profile-access.ts';
import type { ClaudeProfile, ClaudeProfiles } from '../../application/isolation.service.ts';
import { profileAccess } from '../../../shared/infrastructure/claude-access.ts';

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

/**
 * Profils Claude Code surveillés du poste : l'accès d'un profil à son abonnement est son `.credentials.json`, ou le
 * jeton longue durée du fichier qu'il a déclaré.
 */
export class FileClaudeProfiles implements ClaudeProfiles {
  constructor(private readonly profilesOf: () => Promise<ClaudeProfile[]>) {}

  profiles(): Promise<ClaudeProfile[]> {
    return this.profilesOf();
  }

  async access(profile: ClaudeProfile): Promise<{ access: ProfileAccess; account: null | string }> {
    const [account, access] = await Promise.all([
      accountOf(profile.path),
      profileAccess(profile.path, profile.tokenFile),
    ]);
    return { access, account };
  }

  exists(path: string): Promise<boolean> {
    return exists(path);
  }
}
