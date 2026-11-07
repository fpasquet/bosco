// Ce que les scénarios ne voient pas : la liste par défaut est verrouillée, un refus d'un domaine depuis autorisé
// disparaît, et chaque changement est publié au proxy (RF-CONT-07).
import { describe, expect, it } from 'vitest';
import type { EgressRefusal } from '../domain/egress.ts';
import { InvalidIsolation, IsolationService, type IsolationStore } from './isolation.service.ts';

function memoryStore(): IsolationStore {
  let domains: string[] = [];
  let agents: null | number = null;
  const refusals: EgressRefusal[] = [];
  return {
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
});
