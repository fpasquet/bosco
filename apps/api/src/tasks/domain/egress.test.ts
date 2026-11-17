// Ce que les scénarios ne voient pas : la correspondance exacte des domaines de la liste blanche (RF-CONT-07).
import { describe, expect, it } from 'vitest';
import { allows, isDomain } from './egress.ts';

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
});
