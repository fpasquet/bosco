// Ce que les scénarios ne voient pas : l'origine de chaque compte, les choix refusés et le retour au défaut.
import { describe, expect, it } from 'vitest';
import type { IsolationSnapshot } from './isolation.service.ts';
import { AccountsService, type AccountsStore, InvalidAccounts, type RepositoryAccounts } from './accounts.service.ts';

const pro = { account: 'camille@exemple.dev', label: 'pro', path: '/home/dev/.claude' };
const perso = { account: 'camille.perso@exemple.dev', label: 'perso', path: '/home/dev/.claude-perso' };

function service(defaultGithub: null | string = null) {
  const saved = new Map<string, Partial<RepositoryAccounts>>();
  const store: AccountsStore = {
    of: (repository) => Promise.resolve(saved.get(repository) ?? {}),
    save: (repository, accounts) => Promise.resolve(void saved.set(repository, { ...accounts })),
  };
  const secrets = {
    claude: { account: pro.account, available: true, choices: [pro, perso], label: 'pro', profile: pro.path },
    github: { account: defaultGithub ?? 'camille-dev', choices: ['camille-dev', 'camille-pro'] },
    npmrc: { exists: false, path: '~/.npmrc', registries: [] },
  };
  return new AccountsService(store, {
    defaultGithubAccount: () => defaultGithub,
    snapshot: () => Promise.resolve({ secrets } as unknown as IsolationSnapshot),
  });
}

describe('AccountsService', () => {
  it('takes the defaults until the repository has its own accounts (E8a)', async () => {
    const accounts = service();
    const before = await accounts.view('api-voix');
    expect([before.claude.effective?.label, before.claude.origin, before.github.effective]).toEqual([
      'pro',
      'général',
      'camille-dev',
    ]);
    await accounts.update('api-voix', { claudeProfile: perso.path, githubAccount: 'camille-pro' });
    const after = await accounts.view('api-voix');
    expect([after.claude.effective?.label, after.claude.origin, after.github.effective, after.github.origin]).toEqual([
      'perso',
      'dépôt',
      'camille-pro',
      'dépôt',
    ]);
    const own = await accounts.of('api-voix');
    expect(own).toEqual({ claudeProfile: perso.path, githubAccount: 'camille-pro' });
    await accounts.update('api-voix', { claudeProfile: null });
    const back = await accounts.of('api-voix');
    expect(back.claudeProfile).toBeNull();
  });

  it('refuses a profile without access and an account unknown to GitHub CLI', async () => {
    const accounts = service();
    await expect(accounts.update('api-voix', { claudeProfile: '/home/dev/.claude-vide' })).rejects.toThrow(
      InvalidAccounts,
    );
    await expect(accounts.update('api-voix', { githubAccount: 'inconnu' })).rejects.toThrow(/GitHub CLI/);
  });

  it('acts with the account of the repository, else the chosen default, else the active one of gh', async () => {
    const active = await service().githubAccountOf('api-voix');
    const withDefault = service('camille-pro');
    const chosen = await withDefault.githubAccountOf('api-voix');
    await withDefault.update('api-voix', { githubAccount: 'camille-dev' });
    const own = await withDefault.githubAccountOf('api-voix');
    expect([active, chosen, own]).toEqual([null, 'camille-pro', 'camille-dev']);
  });
});
