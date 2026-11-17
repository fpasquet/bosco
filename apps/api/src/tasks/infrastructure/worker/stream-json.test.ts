// Ce que les scénarios ne voient pas : chaque ligne du flux de Claude Code que le worker lit, et celles qu'il ignore.
import { describe, expect, it } from 'vitest';
import { agentEventsOf } from './stream-json.ts';

describe('agentEventsOf', () => {
  it('reads the session, the usage of each message and the result', () => {
    expect(agentEventsOf('{"type":"system","subtype":"init","session_id":"d7f3a20e","tools":["Read"]}')).toEqual([
      { kind: 'session', sessionId: 'd7f3a20e' },
      { kind: 'connector', available: false },
    ]);
    expect(
      agentEventsOf(
        '{"type":"assistant","message":{"model":"claude-haiku-5-5","usage":{"input_tokens":12,"output_tokens":4,"cache_read_input_tokens":100}}}',
      ),
    ).toEqual([
      { kind: 'usage', model: 'claude-haiku-5-5', usage: { input: 12, output: 4, cacheCreation: 0, cacheRead: 100 } },
    ]);
    expect(agentEventsOf('{"type":"result","subtype":"error_max_turns","num_turns":30}')).toMatchObject([
      { kind: 'result', ok: false, stop: 'max_turns' },
    ]);
    expect(agentEventsOf('{"type":"result","subtype":"success","result":"Fait.","num_turns":3}')).toMatchObject([
      { ok: true, report: 'Fait.', turns: 3 },
    ]);
  });

  it('CA-CONT-95 · sees whether the Atlassian connector is plugged in when the agent starts', () => {
    const init = (tools: string[]) =>
      agentEventsOf(JSON.stringify({ type: 'system', subtype: 'init', session_id: 's', tools }));
    expect(init(['Read', 'mcp__claude_ai_Atlassian__getJiraIssue'])).toContainEqual({
      kind: 'connector',
      available: true,
    });
    expect(init(['Read'])).toContainEqual({ kind: 'connector', available: false });
  });

  it('CA-CONT-94 · reads the Jira and Confluence reads of a message, after its usage', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: {
        model: 'claude-haiku-5-5',
        usage: { input_tokens: 1, output_tokens: 1 },
        content: [
          { type: 'text', text: 'Je lis le ticket.' },
          { type: 'tool_use', name: 'mcp__claude_ai_Atlassian__getJiraIssue', input: { issueIdOrKey: 'TTS-142' } },
          { type: 'tool_use', name: 'Read', input: { file_path: '/work/README.md' } },
        ],
      },
    });
    expect(agentEventsOf(line)).toEqual([
      { kind: 'usage', model: 'claude-haiku-5-5', usage: { input: 1, output: 1, cacheCreation: 0, cacheRead: 0 } },
      { kind: 'read', event: 'Lu dans Jira', detail: 'TTS-142' },
    ]);
  });

  it('ignores unknown or broken lines', () => {
    expect([agentEventsOf('{"type":"user"}'), agentEventsOf('{"type":'), agentEventsOf('42')]).toEqual([[], [], []]);
  });
});
