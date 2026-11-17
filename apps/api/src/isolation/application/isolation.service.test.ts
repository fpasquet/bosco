// Ce que les scénarios ne voient pas : la liste par défaut est verrouillée, chaque changement est publié au proxy, et
// l'abonnement par défaut ne se choisit que parmi les profils surveillés qui ont un accès (RF-CONT-07).
import { describe, expect, it } from 'vitest';
import { type ClaudeProfiles, InvalidIsolation, IsolationService, type IsolationStore } from './isolation.service.ts';

function memoryStore(): IsolationStore {
  let domains: string[] = [];
  let subscription: null | string = null;
  return {
    addedDomains: () => Promise.resolve(domains),
    saveAddedDomains: (next) => {
      domains = [...next];
      return Promise.resolve();
    },
    subscription: () => Promise.resolve(subscription),
    saveSubscription: (profile) => {
      subscription = profile;
      return Promise.resolve();
    },
  };
}

const profiles: ClaudeProfiles = {
  profiles: () =>
    Promise.resolve([
      { label: '~/.claude', path: '/home/me/.claude' },
      { label: '~/.claude-perso', path: '/home/me/.claude-perso' },
      { label: '~/.claude-old', path: '/home/me/.claude-old' },
    ]),
  account: (profile) =>
    Promise.resolve(
      profile.endsWith('old')
        ? { account: null, credentials: null }
        : { account: `${profile.split('-')[1] ?? 'pro'}@example.com`, credentials: `${profile}/.credentials.json` },
    ),
  exists: () => Promise.resolve(true),
};

function setup() {
  const published: string[][] = [];
  const service = new IsolationService(
    memoryStore(),
    { publish: (domains) => Promise.resolve(void published.push([...domains])) },
    { defaults: { credentials: '/home/me/.claude/.credentials.json' }, profiles },
  );
  return { published, service };
}

describe('IsolationService', () => {
  it('publishes the allow list on load and on every change, and never removes a locked domain', async () => {
    const { published, service } = setup();
    await service.load();
    await service.addDomain('*.github.com');
    expect(published.at(-1)).toContain('*.github.com');
    await expect(service.removeDomain('api.anthropic.com')).rejects.toBeInstanceOf(InvalidIsolation);
    await service.removeDomain('*.github.com');
    expect(published.at(-1)).not.toContain('*.github.com');
    expect(published).toHaveLength(3);
  });

  it('refuses a domain written with its protocol or a path', async () => {
    const { service } = setup();
    await expect(service.addDomain('https://pypi.org/simple')).rejects.toBeInstanceOf(InvalidIsolation);
  });

  it('copies the access of the default subscription, and of a chosen one', async () => {
    const { service } = setup();
    await service.load();
    const before = await service.credentialsOf();
    expect(before).toBe('/home/me/.claude/.credentials.json');
    await service.setSubscription('/home/me/.claude-perso');
    const after = await service.credentialsOf();
    expect(after).toBe('/home/me/.claude-perso/.credentials.json');
    const snapshot = await service.snapshot();
    expect(snapshot.subscription).toEqual(
      expect.objectContaining({ profile: '/home/me/.claude-perso', label: '~/.claude-perso', available: true }),
    );
    expect(snapshot.subscription.choices.map(({ label }) => label)).toEqual(['~/.claude', '~/.claude-perso']);
  });

  it('refuses a default subscription without access', async () => {
    const { service } = setup();
    await expect(service.setSubscription('/home/me/.claude-old')).rejects.toBeInstanceOf(InvalidIsolation);
  });
});
