// Ce que les scénarios ne voient pas : la traduction des appels d'outils de l'agent réel en lignes de journal, et la
// liste exacte des outils permis (le lanceur scripté des scénarios ne passe pas par Claude Code).
import { describe, expect, it } from 'vitest';
import { ATLASSIAN_READ_TOOLS, connectorReadOf, hasAtlassianConnector } from './atlassian-read.ts';

const tool = (name: string) => `mcp__claude_ai_Atlassian__${name}`;

describe('ATLASSIAN_READ_TOOLS', () => {
  it('CA-CONT-92 · allows only the read tools of the Atlassian connector', () => {
    expect(ATLASSIAN_READ_TOOLS.every((name) => name.startsWith('mcp__claude_ai_Atlassian__'))).toBe(true);
    for (const write of ['createJiraIssue', 'editJiraIssue', 'addCommentToJiraIssue', 'transitionJiraIssue'])
      expect(ATLASSIAN_READ_TOOLS).not.toContain(tool(write));
    for (const write of ['createConfluencePage', 'updateConfluencePage', 'createConfluenceFooterComment'])
      expect(ATLASSIAN_READ_TOOLS).not.toContain(tool(write));
  });
});

describe('connectorReadOf', () => {
  it('CA-CONT-94 · notes what a read tool has read', () => {
    expect(connectorReadOf(tool('getJiraIssue'), { cloudId: 'x', issueIdOrKey: 'TTS-142' })).toEqual({
      event: 'Lu dans Jira',
      detail: 'TTS-142',
    });
    expect(connectorReadOf(tool('getJiraIssueRemoteIssueLinks'), { issueIdOrKey: 'TTS-142' })?.detail).toBe(
      'liens de TTS-142',
    );
    expect(connectorReadOf(tool('searchJiraIssuesUsingJql'), { jql: 'parent =\n TTS-100' })?.detail).toBe(
      'recherche parent = TTS-100',
    );
    expect(connectorReadOf(tool('getConfluencePage'), { pageId: '123' })).toEqual({
      event: 'Lu dans Confluence',
      detail: 'page 123',
    });
    expect(connectorReadOf(tool('getConfluencePageDescendants'), { pageId: '123' })?.detail).toBe(
      'sous-pages de la page 123',
    );
    expect(connectorReadOf(tool('searchConfluenceUsingCql'), { cql: 'title ~ "lexique"' })?.detail).toBe(
      'recherche title ~ "lexique"',
    );
  });

  it('shortens a long search and ignores the other tools', () => {
    const long = connectorReadOf(tool('searchJiraIssuesUsingJql'), { jql: 'x'.repeat(400) })?.detail ?? '';
    expect(long.length).toBeLessThanOrEqual('recherche '.length + 160);
    expect(long.endsWith('…')).toBe(true);
    expect(connectorReadOf(tool('getAccessibleAtlassianResources'), {})).toBeNull();
    expect(connectorReadOf('Read', { file_path: '/work/README.md' })).toBeNull();
    expect(connectorReadOf('mcp__claude_ai_Slack__slack_read_channel', {})).toBeNull();
  });
});

describe('hasAtlassianConnector', () => {
  it('CA-CONT-95 · sees the connector among the tools the agent starts with', () => {
    expect(hasAtlassianConnector(['Read', tool('getJiraIssue')])).toBe(true);
    expect(hasAtlassianConnector(['Read', 'mcp__claude_ai_Slack__slack_read_channel'])).toBe(false);
  });
});
