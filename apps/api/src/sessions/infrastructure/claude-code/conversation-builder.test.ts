// Ce que les scénarios ne voient pas : comment un transcript devient une conversation (tours, réflexions, outils et
// leurs résultats), les lignes rares ou inconnues ignorées (NF-08), et les textes trop longs bornés.
import { describe, expect, it } from 'vitest';
import { bounds, ConversationBuilder, promptText } from './conversation-builder.ts';

const at = (seconds: number) => new Date(Date.UTC(2026, 10, 8, 9, 0, seconds)).toISOString();
const user = (seconds: number, content: unknown, extra: object = {}) =>
  JSON.stringify({ type: 'user', timestamp: at(seconds), message: { role: 'user', content }, ...extra });
const assistant = (seconds: number, block: object) =>
  JSON.stringify({ type: 'assistant', timestamp: at(seconds), message: { role: 'assistant', content: [block] } });

function build(lines: string[]) {
  const builder = new ConversationBuilder();
  for (const line of lines) builder.add(line);
  return builder.result();
}

describe('ConversationBuilder', () => {
  it('turns a prompt and the agent work up to the next prompt into two turns', () => {
    const { turns } = build([
      user(0, 'Corrige l’indexation des PDF.'),
      assistant(4, { type: 'thinking', thinking: 'Le pipeline ignore les pièces jointes.', signature: 'x' }),
      assistant(5, { type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'yarn lint' } }),
      user(7, [{ type: 'tool_result', tool_use_id: 't1', content: 'Done in 1.2s' }]),
      assistant(8, { type: 'text', text: 'Le **lint** passe.' }),
    ]);
    expect(turns.map((turn) => [turn.role, turn.parts.map((part) => part.kind)])).toEqual([
      ['user', ['text']],
      ['assistant', ['reasoning', 'tool', 'text']],
    ]);
    const [reasoning, tool] = turns[1]?.parts ?? [];
    expect(reasoning).toMatchObject({ kind: 'reasoning', seconds: 4, text: 'Le pipeline ignore les pièces jointes.' });
    expect(tool).toMatchObject({
      error: false,
      endedAt: new Date(at(7)),
      input: { command: 'yarn lint' },
      name: 'Bash',
      output: 'Done in 1.2s',
      summary: 'Bash · yarn lint',
    });
  });

  it('keeps a hidden reasoning as a line without text, and a tool without result as running', () => {
    const { turns } = build([
      user(0, 'Lance les tests.'),
      assistant(3, { type: 'thinking', thinking: '', signature: 'x' }),
      assistant(4, { type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'pnpm test' } }),
    ]);
    expect(turns[1]?.parts).toMatchObject([
      { kind: 'reasoning', text: '' },
      { kind: 'tool', endedAt: null, output: null },
    ]);
  });

  it('marks a failed tool, and reads the text blocks of a result', () => {
    const { turns } = build([
      assistant(0, { type: 'tool_use', id: 't1', name: 'Read', input: { file_path: 'a.ts' } }),
      user(1, [
        {
          type: 'tool_result',
          tool_use_id: 't1',
          is_error: true,
          content: [{ type: 'text', text: 'File does not exist.' }, { type: 'image' }],
        },
      ]),
    ]);
    expect(turns[0]?.parts[0]).toMatchObject({ error: true, output: 'File does not exist.\n[image]' });
  });

  it('ignores malformed, unknown, side chain, meta and summary lines', () => {
    const { turns } = build([
      '{not json',
      '[]',
      JSON.stringify({ type: 'atis-latch', timestamp: at(0) }),
      user(1, 'x', { isSidechain: true }),
      user(2, 'Base directory for this skill', { isMeta: true }),
      user(3, 'Résumé de la conversation', { isCompactSummary: true }),
      user(4, [{ type: 'tool_result', tool_use_id: 'inconnu', content: 'orphelin' }]),
      JSON.stringify({ type: 'user', message: { content: 'sans date' } }),
    ]);
    expect(turns).toEqual([]);
  });

  it('keeps only the last parts of a very long session', () => {
    const lines = [user(0, 'Go')];
    for (let index = 0; index < 900; index++) lines.push(assistant(1, { type: 'text', text: `étape ${index}` }));
    const conversation = build(lines);
    expect(conversation.partial).toBe(true);
    expect(conversation.turns).toHaveLength(1);
    expect(conversation.turns[0]?.parts).toHaveLength(800);
    expect(conversation.turns[0]?.parts.at(-1)).toMatchObject({ text: 'étape 899' });
  });
});

describe('promptText', () => {
  it('writes a slash command as typed, without the reminders, and skips local command output', () => {
    expect(promptText('<command-name>/review</command-name><command-args>12</command-args>')).toBe('/review 12');
    expect(promptText('Corrige.<system-reminder>rappel</system-reminder>')).toBe('Corrige.');
    expect(promptText('<local-command-stdout>ok</local-command-stdout>')).toBeNull();
    expect(promptText('<system-reminder>seul</system-reminder>')).toBeNull();
  });
});

describe('bounds', () => {
  it('keeps the head and the tail of a long output', () => {
    const text = `${'a'.repeat(7000)}${'b'.repeat(7000)}`;
    const bounded = bounds(text);
    expect(bounded.startsWith('a'.repeat(6000))).toBe(true);
    expect(bounded.endsWith('b'.repeat(6000))).toBe(true);
    expect(bounded).toContain('2000 caractères non affichés');
  });
});
