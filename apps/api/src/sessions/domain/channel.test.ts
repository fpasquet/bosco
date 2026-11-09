// Ce que les scénarios ne voient pas : la ligne de transcript d'un message du canal, et la commande de lancement (E2i).
import { describe, expect, it } from 'vitest';
import { channelLaunchCommand, channelMessageOf } from './channel.ts';

/** Ligne écrite par Claude Code 2.1.319 pour un message arrivé par un canal */
const line = (server: string, content: string) => ({
  type: 'user',
  isMeta: true,
  origin: { kind: 'channel', server },
  message: { role: 'user', content },
});

describe('channelMessageOf', () => {
  it('reads the text of a message of the Bosco channel, without its tag', () => {
    const record = line('bosco-channel', '<channel source="bosco-channel" from="bosco">\nAjoute un test.\n</channel>');
    expect(channelMessageOf(record)).toBe('Ajoute un test.');
  });

  it('ignores another channel and any other line', () => {
    expect(channelMessageOf(line('telegram', '<channel source="telegram">Salut</channel>'))).toBeNull();
    expect(channelMessageOf({ type: 'user', message: { role: 'user', content: 'Bonjour' } })).toBeNull();
  });
});

describe('channelLaunchCommand', () => {
  it('launches with the channel, the configuration folder first for another profile than ~/.claude', () => {
    expect(channelLaunchCommand('/home/dev/.claude', '/home/dev')).toBe(
      'claude --dangerously-load-development-channels server:bosco-channel',
    );
    expect(channelLaunchCommand('/home/dev/.claude-perso', '/home/dev')).toBe(
      'CLAUDE_CONFIG_DIR=~/.claude-perso claude --dangerously-load-development-channels server:bosco-channel',
    );
  });
});
