// Ce que les scénarios ne voient pas : la reconnaissance du service d'une adresse collée (CA-CONT-34, 35).
import { describe, expect, it } from 'vitest';
import { decisionIdOf, recognize } from './link.ts';

const hosts = { jira: 'https://equipe.atlassian.net', confluence: 'https://equipe.atlassian.net/wiki' };

describe('recognize', () => {
  it('recognizes GitHub, Jira, Confluence and decisions, and keeps any other address as a page', () => {
    expect(recognize('https://github.com/groupe/api-voix/pull/42', hosts)).toEqual({
      service: 'github',
      kind: 'Pull request',
    });
    expect(recognize('https://equipe.atlassian.net/browse/TTS-142', hosts)).toEqual({
      service: 'jira',
      kind: 'Ticket',
    });
    expect(recognize('https://equipe.atlassian.net/wiki/spaces/TTS/pages/123/Lexique', hosts).service).toBe(
      'confluence',
    );
    expect(recognize('DEC-3', hosts)).toEqual({ service: 'decision', kind: 'Décision' });
    expect(recognize('https://exemple.dev/article', hosts)).toEqual({ service: 'page', kind: 'Page' });
    expect(recognize('https://equipe.atlassian.net/browse/TTS-142', { jira: null, confluence: null }).service).toBe(
      'page',
    );
  });

  it('reads the number of a decision', () => {
    expect([
      decisionIdOf('DEC-6'),
      decisionIdOf('http://127.0.0.1:4870/context/decisions/3'),
      decisionIdOf('x'),
    ]).toEqual([6, 3, null]);
  });
});
