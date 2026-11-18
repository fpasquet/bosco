// Ce que les scénarios ne voient pas : la correspondance exacte des domaines de la liste blanche (RF-CONT-07).
import { describe, expect, it } from 'vitest';
import { allows, isDomain, LOCKED_DOMAINS } from './egress.ts';

describe('egress', () => {
  it('allows a listed name, the subdomains of a wildcard, and nothing else', () => {
    const domains = ['api.anthropic.com', '*.github.com'];
    expect(allows(domains, 'API.anthropic.com')).toBe(true);
    expect(allows(domains, 'codeload.github.com')).toBe(true);
    expect(allows(domains, 'github.com')).toBe(false);
    expect(allows(domains, 'evilgithub.com')).toBe(false);
    expect(allows(domains, 'anthropic.com.evil.dev')).toBe(false);
  });

  it('accepts a name or a wildcard, never a URL', () => {
    expect([
      isDomain('pypi.org'),
      isDomain('*.github.com'),
      isDomain('https://pypi.org'),
      isDomain('pypi.org:443'),
    ]).toEqual([true, true, false, false]);
  });

  it('still refuses a single name, an address or an extension that is not letters', () => {
    expect(['localhost', '127.0.0.1', '*.com', 'pypi.o', '*', 'xn--bcher-kva.example'].map(isDomain)).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  it('locks the same domains, sorted, whatever the package adds to its own lists', () => {
    expect(LOCKED_DOMAINS).toEqual([
      'api.anthropic.com',
      'claude.ai',
      'platform.claude.com',
      'registry.npmjs.org',
      'registry.yarnpkg.com',
    ]);
  });
});
