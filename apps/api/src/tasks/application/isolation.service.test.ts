// Ce que les scénarios ne voient pas : la liste par défaut est verrouillée, un refus d'un domaine depuis autorisé
// disparaît, et chaque changement est publié au proxy (RF-CONT-07).
import { describe, expect, it } from 'vitest';
import type { EgressRefusal } from '../domain/egress.ts';
import {
  InvalidIsolation,
  IsolationService,
  type IsolationStore,
  type SecretsChoice,
  type WorkerSecretsReader,
} from './isolation.service.ts';

function memoryStore(): IsolationStore {
  let domains: string[] = [];
  let agents: null | number = null;
  let secrets: SecretsChoice = { npmrc: null, profile: null };
  const refusals: EgressRefusal[] = [];
  return {
    secrets: () => Promise.resolve(secrets),
    saveSecrets: (next) => {
      secrets = { ...next };
      return Promise.resolve();
    },
    addedDomains: () => Promise.resolve(domains),
    maxAgents: () => Promise.resolve(agents),
    record: (refusal) => Promise.resolve(void refusals.push(refusal)),
    refusals: () => Promise.resolve(refusals),
    saveAddedDomains: (next) => {
      domains = [...next];
      return Promise.resolve();
    },
    saveMaxAgents: (next) => {
      agents = next;
      return Promise.resolve();
    },
  };
}

describe('IsolationService', () => {
  it('publishes the list on load and on each change', async () => {
    const published: string[][] = [];
    const service = new IsolationService(memoryStore(), {
      publish: (list) => Promise.resolve(void published.push([...list])),
    });
    await service.load();
    await service.addDomain(' PyPI.org ');
    expect(published.at(-1)).toContain('pypi.org');
    await service.removeDomain('pypi.org');
    expect(published.at(-1)).not.toContain('pypi.org');
    expect(published).toHaveLength(3);
  });

  it('keeps the default list locked and refuses a URL', async () => {
    const service = new IsolationService(memoryStore(), { publish: () => Promise.resolve() });
    await expect(service.removeDomain('api.anthropic.com')).rejects.toBeInstanceOf(InvalidIsolation);
    await expect(service.addDomain('https://pypi.org/simple')).rejects.toBeInstanceOf(InvalidIsolation);
    await expect(service.addDomain('claude.ai')).rejects.toBeInstanceOf(InvalidIsolation);
    await expect(service.setMaxAgents(9)).rejects.toBeInstanceOf(InvalidIsolation);
  });

  it('hides the refusals of a domain allowed since', async () => {
    const service = new IsolationService(memoryStore(), { publish: () => Promise.resolve() });
    await service.refused({ at: new Date(), host: 'files.pythonhosted.org', taskId: 3 });
    await service.refused({ at: new Date(), host: 'pypi.org', taskId: 3 });
    const { refusals } = await service.addDomain('pypi.org');
    expect(refusals.map((refusal) => refusal.host)).toEqual(['files.pythonhosted.org']);
  });

  describe('secrets of the tasks (E11b)', () => {
    const files: Record<string, string> = {
      '/home/dev/.claude/.credentials.json': '{}',
      '/home/dev/.claude-perso/.credentials.json': '{}',
      '/home/dev/.npmrc':
        '@interne:registry=https://npm.registre.exemple.dev/\n//npm.registre.exemple.dev/:_authToken=x',
    };
    const reader: WorkerSecretsReader = {
      profiles: () =>
        Promise.resolve([
          { label: 'pro', path: '/home/dev/.claude' },
          { label: 'perso', path: '/home/dev/.claude-perso' },
          { label: 'vide', path: '/home/dev/.claude-vide' },
        ]),
      account: (profile) =>
        Promise.resolve({
          account: profile.endsWith('perso') ? 'moi@exemple.dev' : null,
          credentials: files[`${profile}/.credentials.json`] ? `${profile}/.credentials.json` : null,
        }),
      exists: (path) => Promise.resolve(path in files),
      npmrc: (path) => Promise.resolve(files[path] ?? null),
    };
    const defaults = { credentials: '/home/dev/.claude/.credentials.json', home: '/home/dev', npmrc: '~/.npmrc' };

    it('gives the access of the chosen profile and the .npmrc, whose registries are allowed', async () => {
      const service = new IsolationService(memoryStore(), { publish: () => Promise.resolve() }, { defaults, reader });
      await service.load();
      const snapshot = await service.snapshot();
      expect(snapshot.secrets.claude).toMatchObject({ label: 'pro', available: true });
      expect(snapshot.secrets.claude.choices.map(({ label }) => label)).toEqual(['pro', 'perso']);
      expect(snapshot.secrets.npmrc).toMatchObject({ exists: true, path: '~/.npmrc' });
      expect(service.allowList()).toContain('npm.registre.exemple.dev');
      await service.setSecrets({ profile: '/home/dev/.claude-perso' });
      const secrets = await service.workerSecrets();
      expect(secrets).toEqual({
        credentials: '/home/dev/.claude-perso/.credentials.json',
        npmrc: '/home/dev/.npmrc',
      });
      const chosen = await service.snapshot();
      expect(chosen.secrets.claude).toMatchObject({ account: 'moi@exemple.dev', label: 'perso' });
    });

    it('refuses a profile without access and a relative .npmrc', async () => {
      const service = new IsolationService(memoryStore(), { publish: () => Promise.resolve() }, { defaults, reader });
      await service.load();
      await expect(service.setSecrets({ profile: '/home/dev/.claude-vide' })).rejects.toThrow(InvalidIsolation);
      await expect(service.setSecrets({ npmrc: '.npmrc' })).rejects.toThrow(/comme dans le terminal/);
      await service.setSecrets({ npmrc: '~/absent/.npmrc' });
      const secrets = await service.workerSecrets();
      expect(secrets.npmrc).toBeNull();
      expect(service.allowList()).not.toContain('npm.registre.exemple.dev');
    });
  });
});
