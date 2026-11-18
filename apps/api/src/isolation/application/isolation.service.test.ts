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

/** pro et perso sont connectés, ultra a un jeton longue durée, broken un jeton dont le fichier est vide, old rien. */
const profiles: ClaudeProfiles = {
  profiles: () =>
    Promise.resolve([
      { label: '~/.claude', path: '/home/me/.claude', tokenFile: null },
      { label: '~/.claude-perso', path: '/home/me/.claude-perso', tokenFile: null },
      { label: '~/.claude-ultra', path: '/home/me/.claude-ultra', tokenFile: '/home/me/secrets/ultra-token' },
      { label: '~/.claude-broken', path: '/home/me/.claude-broken', tokenFile: '/home/me/secrets/empty' },
      { label: '~/.claude-old', path: '/home/me/.claude-old', tokenFile: null },
    ]),
  access: ({ path, tokenFile }) => {
    if (path.endsWith('old'))
      return Promise.resolve({ access: { kind: 'none', problem: null, tokenFile }, account: null });
    if (path.endsWith('broken'))
      return Promise.resolve({
        access: { kind: 'none', problem: 'Le fichier du jeton est vide.', tokenFile },
        account: null,
      });
    if (tokenFile) return Promise.resolve({ access: { kind: 'token', tokenFile }, account: null });
    return Promise.resolve({
      access: { kind: 'login', credentials: `${path}/.credentials.json` },
      account: `${path.split('-')[1] ?? 'pro'}@example.com`,
    });
  },
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
    const before = await service.accessOf();
    expect(before).toEqual({ kind: 'login', credentials: '/home/me/.claude/.credentials.json' });
    await service.setSubscription('/home/me/.claude-perso');
    const after = await service.accessOf();
    expect(after).toEqual({ kind: 'login', credentials: '/home/me/.claude-perso/.credentials.json' });
    const snapshot = await service.snapshot();
    expect(snapshot.subscription).toEqual(
      expect.objectContaining({ profile: '/home/me/.claude-perso', label: '~/.claude-perso', available: true }),
    );
    expect(snapshot.subscription.choices.map(({ label }) => label)).toEqual([
      '~/.claude',
      '~/.claude-perso',
      '~/.claude-ultra',
    ]);
  });

  it('CA-REGL-33 · offers a profile with a long-lived token, whose access is the file of its token, never copied', async () => {
    const { service } = setup();
    await service.load();
    await service.setSubscription('/home/me/.claude-ultra');
    const { subscription } = await service.snapshot();
    expect(subscription).toEqual(expect.objectContaining({ access: 'token', account: null, available: true }));
    expect(subscription.choices).toContainEqual({
      access: 'token',
      account: null,
      label: '~/.claude-ultra',
      path: '/home/me/.claude-ultra',
      tokenFile: '/home/me/secrets/ultra-token',
    });
    const access = await service.accessOf();
    expect(access).toEqual({ kind: 'token', tokenFile: '/home/me/secrets/ultra-token' });
  });

  it('CA-REGL-33 · keeps a profile without usable access out of the choices, with its reason', async () => {
    const { service } = setup();
    const { subscription } = await service.snapshot();
    expect(subscription.unavailable).toEqual([
      {
        label: '~/.claude-broken',
        path: '/home/me/.claude-broken',
        problem: 'Le fichier du jeton est vide.',
        tokenFile: '/home/me/secrets/empty',
      },
      { label: '~/.claude-old', path: '/home/me/.claude-old', problem: null, tokenFile: null },
    ]);
    await expect(service.setSubscription('/home/me/.claude-broken')).rejects.toBeInstanceOf(InvalidIsolation);
    // Un jeton déclaré qui ne se lit plus passe tel quel : le tour dira pourquoi, sans prendre un autre compte
    const broken = await service.accessOf('/home/me/.claude-broken');
    expect(broken).toEqual({
      kind: 'token',
      tokenFile: '/home/me/secrets/empty',
    });
  });

  it('refuses a default subscription without access', async () => {
    const { service } = setup();
    await expect(service.setSubscription('/home/me/.claude-old')).rejects.toBeInstanceOf(InvalidIsolation);
  });
});
