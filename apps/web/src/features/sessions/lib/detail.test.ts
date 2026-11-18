import { describe, expect, it } from 'vitest';
// Ce que les scénarios ne voient pas : la reprise selon le profil et les projets, la part du cache, la fin de la durée
// et les fichiers modifiés rangés par projet.
import type { SessionDto, SourceDto } from '@bosco/domain';
import { cacheShare, durationEnd, filesIn, resumeCommand } from './detail';

const sources: SourceDto[] = [
  {
    id: 'pro',
    label: 'pro',
    liveTracking: true,
    managed: false,
    path: '/home/dev/.claude',
    unreadable: false,
    watched: true,
  },
  {
    id: 'perso',
    label: 'perso',
    liveTracking: true,
    managed: false,
    path: '/home/dev/.claude-perso',
    unreadable: false,
    watched: true,
  },
];

const session = (overrides: Partial<SessionDto>) =>
  ({
    id: 'c41e9a07-1111',
    sourceId: 'pro',
    state: 'ended',
    lastEventAt: '2026-11-06T14:10:00.000Z',
    usage: { input: 10, output: 5, cacheCreation: 26, cacheRead: 64 },
    ...overrides,
  }) as SessionDto;

describe('resumeCommand', () => {
  it('resumes a closed session, with the configuration folder of another profile', () => {
    expect(resumeCommand(session({}), sources, '/home/dev')).toBe('claude --resume c41e9a07-1111');
    expect(resumeCommand(session({ sourceId: 'perso' }), sources, '/home/dev')).toBe(
      'CLAUDE_CONFIG_DIR=~/.claude-perso claude --resume c41e9a07-1111',
    );
  });

  it('adds the other projects of a session over several projects, with the setting that reads their instructions', () => {
    const pilot = {
      projects: ['/home/dev/www/site-clubs', '/home/dev/www/creneaux'],
      running: false,
    } as SessionDto['pilot'];
    expect(resumeCommand(session({ pilot, sourceId: 'perso', state: 'waiting' }), sources, '/home/dev')).toBe(
      'CLAUDE_CONFIG_DIR=~/.claude-perso CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --resume c41e9a07-1111 --add-dir ~/www/site-clubs --add-dir ~/www/creneaux',
    );
  });

  it('files the changed files under each project, the relative ones under the principal', () => {
    const files = ['/home/dev/www/api-tarifs/src/grille.ts', 'src/tarifs.ts', '/home/dev/www/site-clubs/src/club.tsx'];
    const several = session({
      addedProjects: [{ id: 5, name: 'site-clubs', root: '/home/dev/www/site-clubs' }],
      changedFiles: files.map((path) => ({ added: 1, path, removed: 0 })),
      project: { folder: '', id: 3, name: 'api-tarifs', root: '/home/dev/www/api-tarifs' },
    });
    const paths = (root: string) => filesIn(several, root).map(({ path }) => path);
    expect([
      paths('/home/dev/www/api-tarifs'),
      paths('/home/dev/www/site-clubs'),
      paths('/home/dev/www/creneaux'),
    ]).toEqual([
      ['/home/dev/www/api-tarifs/src/grille.ts', 'src/tarifs.ts'],
      ['/home/dev/www/site-clubs/src/club.tsx'],
      [],
    ]);
  });

  it('gives nothing for a session still open (RF-SESS-09)', () => {
    expect(resumeCommand(session({ state: 'running' }), sources, '/home/dev')).toBeNull();
    expect(resumeCommand(session({ state: 'inactive' }), sources, '/home/dev')).toBeNull();
  });
});

describe('cacheShare and durationEnd', () => {
  it('counts the cache read on what the model read, and stops the duration at the last event once closed', () => {
    const now = new Date('2026-11-06T15:00:00.000Z');
    expect(cacheShare(session({}).usage)).toBe(64);
    expect(durationEnd(session({}), now).toISOString()).toBe('2026-11-06T14:10:00.000Z');
    expect(durationEnd(session({ state: 'running' }), now)).toBe(now);
  });
});
