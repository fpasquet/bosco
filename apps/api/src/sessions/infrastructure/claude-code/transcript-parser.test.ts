// Ce que les scénarios ne voient pas : les lignes rares ou inconnues du format interne de Claude Code (NF-08), et
// l'usage d'un message écrit bloc par bloc, compté une seule fois.
import { describe, expect, it } from 'vitest';
import { TranscriptParser } from './transcript-parser.ts';

const base = {
  sessionId: 'c41e9a07',
  cwd: '/home/dev/labo-ia/packages/bosco',
  gitBranch: 'feat/specs',
  timestamp: '2026-11-06T14:02:00Z',
};
const usage = { input_tokens: 10, output_tokens: 20, cache_creation_input_tokens: 30, cache_read_input_tokens: 40 };
const assistant = (content: unknown) =>
  JSON.stringify({
    ...base,
    type: 'assistant',
    message: { id: 'msg_1', model: 'claude-opus-5-5', content: [content], usage },
  });

describe('TranscriptParser', () => {
  it('ignores malformed, unknown, side chain and meta lines', () => {
    const parser = new TranscriptParser();
    for (const line of [
      '{not json',
      '[]',
      JSON.stringify({ type: 'atis-latch', sessionId: 'c41e9a07' }),
      JSON.stringify({ ...base, type: 'user', isSidechain: true, message: { content: 'x' } }),
      JSON.stringify({ ...base, type: 'user', isMeta: true, message: { content: 'x' } }),
    ]) {
      expect(parser.parse(line)).toEqual([]);
    }
  });

  it('keeps tool results out of the prompts', () => {
    const line = JSON.stringify({
      ...base,
      type: 'user',
      message: { content: [{ type: 'tool_result', content: 'ok' }] },
    });
    expect(new TranscriptParser().parse(line)).toEqual([]);
  });

  it('counts the usage of a message written block by block only once', () => {
    const parser = new TranscriptParser();
    const first = parser.parse(assistant({ type: 'text', text: 'Je relis les specs.' }));
    const second = parser.parse(
      assistant({ type: 'tool_use', name: 'Bash', input: { command: 'npm run db:migrate' } }),
    );
    expect(first[0]?.event.usage?.total).toBe(100);
    expect(second[0]?.event).toMatchObject({ kind: 'tool', text: 'Bash · npm run db:migrate', usage: null });
  });

  it('shortens long messages to one line', () => {
    const line = JSON.stringify({ ...base, type: 'user', message: { content: `ligne\n${'a'.repeat(400)}` } });
    const [parsed] = new TranscriptParser().parse(line);
    expect(parsed?.event.text).toHaveLength(280);
    expect(parsed?.event.text).not.toContain('\n');
  });
});
