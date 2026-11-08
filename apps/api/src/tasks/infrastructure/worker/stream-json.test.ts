// Ce que les scénarios ne voient pas : chaque ligne du flux de Claude Code que le worker lit, et celles qu'il ignore.
import { describe, expect, it } from 'vitest';
import { agentEventOf } from './stream-json.ts';

describe('agentEventOf', () => {
  it('reads the session, the usage of each message and the result', () => {
    expect(agentEventOf('{"type":"system","subtype":"init","session_id":"d7f3a20e"}')).toEqual({
      kind: 'session',
      sessionId: 'd7f3a20e',
    });
    expect(
      agentEventOf(
        '{"type":"assistant","message":{"model":"claude-haiku-5-5","usage":{"input_tokens":12,"output_tokens":4,"cache_read_input_tokens":100}}}',
      ),
    ).toEqual({
      kind: 'usage',
      model: 'claude-haiku-5-5',
      usage: { input: 12, output: 4, cacheCreation: 0, cacheRead: 100 },
    });
    expect(agentEventOf('{"type":"result","subtype":"error_max_turns","num_turns":30}')).toMatchObject({
      kind: 'result',
      ok: false,
      stop: 'max_turns',
    });
    expect(agentEventOf('{"type":"result","subtype":"success","result":"Fait.","num_turns":3}')).toMatchObject({
      ok: true,
      report: 'Fait.',
      turns: 3,
    });
  });

  it('ignores unknown or broken lines', () => {
    expect([agentEventOf('{"type":"user"}'), agentEventOf('{"type":'), agentEventOf('42')]).toEqual([null, null, null]);
  });
});
