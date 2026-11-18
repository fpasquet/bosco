// Ce que les scénarios ne voient pas : le fichier d'un jeton longue durée refusé avant d'être gardé, et la source tenue
// par Bosco, qui n'en déclare jamais (RF-REGL-07).
import { describe, expect, it } from 'vitest';
import type { ProfileFinder, SourceRepository } from './ports.ts';
import { ManagedSource, Source } from '../domain/source.ts';
import { InvalidTokenFile, SourceService } from './source.service.ts';

function setup() {
  const sources = [
    Source.choose('ultra', '/home/camille/.claude-ultra', true),
    Source.manage('sandboxes', '/home/camille/.local/share/bosco/sandboxes/profile'),
  ];
  const repository: SourceRepository = {
    list: () => Promise.resolve(sources),
    save: () => Promise.resolve(),
  };
  const finder = {
    tokenFileProblem: (path: string) =>
      Promise.resolve(path.endsWith('empty') ? 'Le fichier du jeton est vide.' : null),
  } as unknown as ProfileFinder;
  const service = new SourceService(
    repository,
    finder,
    {} as never,
    {} as never,
    { now: () => new Date() },
    {} as never,
    {} as never,
  );
  return { service, sources };
}

describe('long-lived token of a profile', () => {
  it('CA-REGL-32 · keeps the path of the file of the token, then forgets it', async () => {
    const { service } = setup();
    const declared = await service.declareToken('ultra', '/home/camille/secrets/ultra-token');
    expect(declared?.tokenFile).toBe('/home/camille/secrets/ultra-token');
    const removed = await service.declareToken('ultra', null);
    expect(removed?.tokenFile).toBeNull();
  });

  it('CA-REGL-32 · refuses a file that cannot serve as a token, with its reason', async () => {
    const { service, sources } = setup();
    await expect(service.declareToken('ultra', '/home/camille/secrets/empty')).rejects.toEqual(
      new InvalidTokenFile('Le fichier du jeton est vide.'),
    );
    expect(sources[0]?.tokenFile).toBeNull();
  });

  it('refuses a token for the profile of the sandboxes, kept by Bosco', async () => {
    const { service } = setup();
    await expect(service.declareToken('sandboxes', '/home/camille/secrets/ultra-token')).rejects.toBeInstanceOf(
      ManagedSource,
    );
  });

  it('answers null for an unknown source', async () => {
    const { service } = setup();
    const unknown = await service.declareToken('unknown', null);
    expect(unknown).toBeNull();
  });
});
