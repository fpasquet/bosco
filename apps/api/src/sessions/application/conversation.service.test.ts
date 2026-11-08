// Ce que les scénarios ne voient pas : le transcript effacé par Claude Code, qui fait rabattre le fil sur le journal.
import { describe, expect, it } from 'vitest';
import type { ConversationReader, SessionRepository, SourceRepository } from './ports.ts';
import { Session } from '../domain/session.ts';
import { Source } from '../domain/source.ts';
import { ConversationService } from './conversation.service.ts';

const session = Session.discover('c41e9a07', 'perso', new Date('2026-11-08T09:00:00Z'));
const sessions = {
  find: (id: string) => Promise.resolve(id === 'c41e9a07' ? session : null),
} as unknown as SessionRepository;
const sources = {
  list: () => Promise.resolve([Source.choose('perso', '/home/dev/.claude-perso', true)]),
} as unknown as SourceRepository;

describe('ConversationService', () => {
  it('reads the transcript in the profile of the session', async () => {
    const reader: ConversationReader = {
      read: (profile, id) =>
        Promise.resolve(
          profile === '/home/dev/.claude-perso' && id === 'c41e9a07' ? { partial: false, turns: [] } : null,
        ),
    };
    const result = await new ConversationService(sessions, sources, reader).conversation('c41e9a07');
    expect(result).toEqual({ kind: 'found', conversation: { partial: false, turns: [] } });
  });

  it('says when the transcript is gone, and when the session is unknown', async () => {
    const reader: ConversationReader = { read: () => Promise.resolve(null) };
    const service = new ConversationService(sessions, sources, reader);
    const gone = await service.conversation('c41e9a07');
    const unknown = await service.conversation('inconnue');
    expect(gone).toEqual({ kind: 'gone' });
    expect(unknown).toEqual({ kind: 'unknownSession' });
  });
});
