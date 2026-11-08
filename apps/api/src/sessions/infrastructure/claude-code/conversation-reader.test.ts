// Ce que les scénarios ne voient pas : la lecture par la fin d'un long transcript, et les lectures suivantes qui ne
// lisent que les lignes ajoutées, même coupées au milieu.
import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FileConversationReader } from './conversation-reader.ts';

const line = (text: string, second = 0) =>
  `${JSON.stringify({
    type: 'user',
    timestamp: new Date(Date.UTC(2026, 10, 8, 9, 0, second)).toISOString(),
    message: { content: text },
  })}\n`;

function profileWith(content: string): { file: string; profile: string } {
  const profile = mkdtempSync(join(tmpdir(), 'bosco-conversation-'));
  const folder = join(profile, 'projects', '-home-dev-labo-ia');
  mkdirSync(folder, { recursive: true });
  const file = join(folder, 'c41e9a07.jsonl');
  writeFileSync(file, content);
  return { file, profile };
}

const prompts = (conversation: Awaited<ReturnType<FileConversationReader['read']>>) =>
  conversation?.turns.map((turn) => (turn.parts[0]?.kind === 'text' ? turn.parts[0].text : null));

describe('FileConversationReader', () => {
  it('finds the transcript of a session in any project folder, and null once it is gone', async () => {
    const { profile } = profileWith(line('Première demande'));
    const reader = new FileConversationReader();
    const found = await reader.read(profile, 'c41e9a07');
    const unknown = await reader.read(profile, 'inconnue');
    expect(prompts(found)).toEqual(['Première demande']);
    expect(unknown).toBeNull();
  });

  it('reads only the added lines, a line cut in the middle waiting for its end', async () => {
    const { file, profile } = profileWith(line('Un'));
    const reader = new FileConversationReader();
    await reader.read(profile, 'c41e9a07');
    const second = line('Deux', 1);
    appendFileSync(file, second.slice(0, 20));
    const cut = await reader.read(profile, 'c41e9a07');
    appendFileSync(file, second.slice(20));
    const complete = await reader.read(profile, 'c41e9a07');
    expect(prompts(cut)).toEqual(['Un']);
    expect(prompts(complete)).toEqual(['Un', 'Deux']);
  });

  it('reads a long transcript by its end, and says the beginning is missing', async () => {
    const content = Array.from({ length: 50 }, (_, index) => line(`Demande ${index}`, index)).join('');
    const { profile } = profileWith(content);
    const conversation = await new FileConversationReader(1000).read(profile, 'c41e9a07');
    expect(conversation?.partial).toBe(true);
    expect(prompts(conversation)?.at(-1)).toBe('Demande 49');
    expect(prompts(conversation)?.length).toBeLessThan(50);
  });
});
