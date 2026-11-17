// Ce que les scénarios ne voient pas : la reconnaissance du service d'une adresse collée (CA-CONT-34, 35) et ce qu'on
// tire de l'adresse d'un lien Jira ou Confluence (CA-CONT-90).
import { describe, expect, it } from 'vitest';
import { decisionIdOf, readingFromAddress, recognize } from './link.ts';

describe('recognize', () => {
  it('recognizes GitHub, Jira, Confluence and decisions, and keeps any other address as a page', () => {
    expect(recognize('https://github.com/groupe/api-voix/pull/42')).toEqual({
      service: 'github',
      kind: 'Pull request',
    });
    expect(recognize('https://equipe.atlassian.net/browse/TTS-142')).toEqual({ service: 'jira', kind: 'Ticket' });
    expect(recognize('https://equipe.atlassian.net/wiki/spaces/TTS/pages/123/Lexique').service).toBe('confluence');
    expect(recognize('DEC-3')).toEqual({ service: 'decision', kind: 'Décision' });
    expect(recognize('https://exemple.dev/article')).toEqual({ service: 'page', kind: 'Page' });
  });

  it('keeps an Atlassian address without a ticket or a wiki page, and any other site, as a page', () => {
    expect(recognize('https://equipe.atlassian.net/jira/dashboards').service).toBe('page');
    expect(recognize('https://jira.exemple.dev/browse/TTS-142').service).toBe('page');
    expect(recognize('https://exemple.dev/wiki/spaces/TTS/pages/123').service).toBe('page');
  });

  it('reads the number of a decision', () => {
    expect([
      decisionIdOf('DEC-6'),
      decisionIdOf('http://127.0.0.1:4870/context/decisions/3'),
      decisionIdOf('x'),
    ]).toEqual([6, 3, null]);
  });
});

describe('readingFromAddress', () => {
  it('keeps the key of a Jira ticket, without state or assignee', () => {
    expect(readingFromAddress('jira', 'https://equipe.atlassian.net/browse/TTS-142?focusedCommentId=9')).toEqual({
      title: 'TTS-142',
      state: null,
      person: null,
    });
  });

  it('takes the title of a Confluence page from its address, or keeps the address', () => {
    const page = 'https://equipe.atlassian.net/wiki/spaces/TTS/pages/123/Lexique+de+prononciation';
    expect(readingFromAddress('confluence', page).title).toBe('Lexique de prononciation');
    expect(readingFromAddress('confluence', `${page.replace('Lexique+de', 'R%C3%A8gles+de')}#haut`).title).toBe(
      'Règles de prononciation',
    );
    const short = 'https://equipe.atlassian.net/wiki/x/AbCd';
    expect(readingFromAddress('confluence', short).title).toBe(short);
  });
});
