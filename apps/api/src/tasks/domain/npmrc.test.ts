// Ce que les scénarios ne voient pas : la lecture des registres d'un .npmrc, sans ses jetons.
import { describe, expect, it } from 'vitest';
import { npmRegistries } from './npmrc.ts';

describe('npmRegistries', () => {
  it('reads the registries of the scopes and the default one, never the tokens', () => {
    const npmrc = [
      '# registres de la société',
      '@interne:registry=https://npm.registre.exemple.dev/',
      '//npm.registre.exemple.dev/:_authToken=secret',
      'registry=https://registry.npmjs.org/',
      '@outils:registry = https://npm.outils.exemple.dev/npm/',
      'always-auth=true',
      '@casse:registry=pas-une-adresse',
    ].join('\n');
    expect(npmRegistries(npmrc)).toEqual([
      { host: 'npm.registre.exemple.dev', scope: '@interne' },
      { host: 'npm.outils.exemple.dev', scope: '@outils' },
    ]);
  });
});
