// Ce que les scénarios ne voient pas, la lecture y étant trop rapide : l'avancement réel de la première lecture d'un
// profil, et l'ordre dans lequel ses sessions arrivent.
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { SessionService } from '../../application/session.service.ts';
import type { TranscriptCursorStore } from '../persistence/transcript-cursor.store.ts';
import { Source } from '../../domain/source.ts';
import { SessionEventsBus } from '../events/session-events.bus.ts';
import { FileTranscriptWatcher, isTranscriptPath } from './transcript-watcher.ts';

const line = (sessionId: string, text: string) =>
  `${JSON.stringify({ sessionId, type: 'user', timestamp: '2026-11-06T14:02:00Z', message: { content: text } })}\n`;

describe('first reading of a profile', () => {
  const profile = mkdtempSync(join(tmpdir(), 'bosco-profile-'));
  afterEach(() => rmSync(profile, { recursive: true, force: true }));

  it('CA-SESS-19 · CA-SESS-20 · reports its real progress, reads the recent sessions first, then ends', async () => {
    const folder = join(profile, 'projects', '-home-camille-maison');
    mkdirSync(folder, { recursive: true });
    const sessions = [
      { id: 'c41e9a07', minutesAgo: 1, text: 'Ajoute les catégories au budget du foyer' },
      { id: '5b2d81e4', minutesAgo: 30, text: 'Corrige l’arrondi des remboursements' },
      { id: 'a41f07c2', minutesAgo: 600, text: 'Mets à jour les dépendances' },
    ];
    // Écrits dans le désordre : seule leur date de modification compte
    for (const { id, minutesAgo, text } of sessions.toReversed()) {
      const file = join(folder, `${id}.jsonl`);
      writeFileSync(file, line(id, text));
      const at = new Date(Date.now() - minutesAgo * 60_000);
      utimesSync(file, at, at);
    }
    const read: string[] = [];
    const progress: unknown[] = [];
    const offsets = new Map<string, number>();
    const watcher = new FileTranscriptWatcher(
      {
        recordTranscript: (_source: string, sessionId: string) => {
          read.push(sessionId);
          return Promise.resolve(null);
        },
      } as unknown as SessionService,
      {
        offsetOf: (path: string) => Promise.resolve(offsets.get(path) ?? 0),
        moveTo: (path: string, offset: number) => Promise.resolve(void offsets.set(path, offset)),
      } as unknown as TranscriptCursorStore,
      (step) => progress.push(step),
    );
    await watcher.watch(Source.choose('pro', profile, true), new Date(Date.now() - 24 * 60 * 60_000));
    await watcher.close();
    expect(read).toEqual(['c41e9a07', '5b2d81e4', 'a41f07c2']);
    expect(progress).toEqual([{ read: 0, total: 3 }, { read: 1, total: 3 }, { read: 2, total: 3 }, null]);
  });

  it('CA-SESS-21 · gives the progress again to a screen that comes back during the reading', () => {
    const bus = new SessionEventsBus();
    bus.importProgress.next({ read: 1240, total: 3180 });
    const seen: unknown[] = [];
    bus.importProgress.subscribe((step) => seen.push(step)).unsubscribe();
    expect(seen).toEqual([{ read: 1240, total: 3180 }]);
  });
});

describe('subagents of a session', () => {
  const profile = mkdtempSync(join(tmpdir(), 'bosco-profile-'));
  afterEach(() => rmSync(profile, { recursive: true, force: true }));

  it('CA-SESS-188 · reads the transcripts of the subagents for their usage, and never counts them as sessions', async () => {
    const folder = join(profile, 'projects', '-home-camille-maison');
    const subagents = join(folder, 'c41e9a07', 'subagents');
    mkdirSync(subagents, { recursive: true });
    mkdirSync(join(folder, 'c41e9a07', 'tool-results'), { recursive: true });
    writeFileSync(join(folder, 'c41e9a07.jsonl'), line('c41e9a07', 'Ajoute les catégories au budget du foyer'));
    const reply = JSON.stringify({
      sessionId: 'c41e9a07',
      isSidechain: true,
      type: 'assistant',
      timestamp: '2026-11-06T14:03:00Z',
      message: { id: 'msg_sub', model: 'claude-sonnet-5-5', content: [], usage: { output_tokens: 42 } },
    });
    writeFileSync(join(subagents, 'agent-a0383c7c.jsonl'), `${reply}\n`);
    writeFileSync(join(subagents, 'agent-a0383c7c.meta.json'), '{"agentType":"general-purpose"}\n');
    writeFileSync(join(folder, 'c41e9a07', 'tool-results', 'result.jsonl'), line('c41e9a07', 'ignoré'));
    const read: { kinds: string[]; sessionId: string }[] = [];
    const offsets = new Map<string, number>();
    const watcher = new FileTranscriptWatcher(
      {
        recordTranscript: (_source: string, sessionId: string, events: { kind: string }[]) => {
          read.push({ sessionId, kinds: events.map(({ kind }) => kind) });
          return Promise.resolve(null);
        },
      } as unknown as SessionService,
      {
        offsetOf: (path: string) => Promise.resolve(offsets.get(path) ?? 0),
        moveTo: (path: string, offset: number) => Promise.resolve(void offsets.set(path, offset)),
      } as unknown as TranscriptCursorStore,
    );
    const source = Source.choose('pro', profile, true);
    await watcher.watch(source, new Date(0));
    const unread = await watcher.countUnread(source, new Date(Date.now() + 60_000));
    await watcher.close();
    expect(read).toEqual([
      expect.objectContaining({ sessionId: 'c41e9a07', kinds: expect.arrayContaining(['prompt']) as unknown }),
      { sessionId: 'c41e9a07', kinds: ['subagentUsage'] },
    ]);
    expect(read).toHaveLength(2);
    // Le transcript de la session est déjà lu ; le sous-agent ne compte pas comme une session de plus
    expect(unread).toBe(0);
  });

  it('follows the transcripts of sessions and subagents, and nothing else of their folders', () => {
    expect(isTranscriptPath('-home-camille-maison', false)).toBe(true);
    expect(isTranscriptPath('-home-camille-maison/c41e9a07.jsonl', true)).toBe(true);
    expect(isTranscriptPath('-home-camille-maison/c41e9a07', false)).toBe(true);
    expect(isTranscriptPath('-home-camille-maison/c41e9a07/subagents', false)).toBe(true);
    expect(isTranscriptPath('-home-camille-maison/c41e9a07/subagents/agent-a0383c7c.jsonl', true)).toBe(true);
    expect(isTranscriptPath('-home-camille-maison/c41e9a07/subagents/agent-a0383c7c.meta.json', true)).toBe(false);
    expect(isTranscriptPath('-home-camille-maison/c41e9a07/tool-results', false)).toBe(false);
    expect(isTranscriptPath('-home-camille-maison/notes.txt', true)).toBe(false);
  });
});
