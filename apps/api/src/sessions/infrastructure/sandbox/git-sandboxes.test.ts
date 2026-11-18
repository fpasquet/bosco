// Ce que les scénarios ne voient pas, faute de Docker : les dossiers qu'un bac à sable monte dans son conteneur.
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { GitSandboxes, type SandboxContainers } from './git-sandboxes.ts';

describe('folders of a sandbox', () => {
  const root = mkdtempSync(join(tmpdir(), 'bosco-sandboxes-'));
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('CA-SESS-107 · mounts a copy of each project of the session at its path, and nothing else of the workstation', async () => {
    const sessionId = 'd93b51f0-0000-4000-8000-000000000000';
    for (const copy of ['repo', 'repo-1']) mkdirSync(join(root, sessionId, copy), { recursive: true });
    const specs: Parameters<SandboxContainers['ensure']>[0][] = [];
    const containers = {
      ensure: (spec: Parameters<SandboxContainers['ensure']>[0]) => {
        specs.push(spec);
        return Promise.resolve();
      },
      exec: () => ({ args: [], file: 'docker' }),
    } as unknown as SandboxContainers;
    const sandboxes = new GitSandboxes(root, containers, () =>
      Promise.resolve({ kind: 'login', credentials: '/home/camille/.claude/.credentials.json' }),
    );
    await sandboxes.ensure(sessionId, ['/home/camille/www/api-tarifs', '/home/camille/www/site-clubs']);
    expect(specs[0]?.mounts).toEqual([
      { from: join(root, sessionId, 'repo'), to: '/home/camille/www/api-tarifs' },
      { from: join(root, sessionId, 'repo-1'), to: '/home/camille/www/site-clubs' },
      { from: join(root, sessionId, 'home'), to: '/home/agent' },
      {
        from: join(root, 'profile', 'projects', '-home-camille-www-api-tarifs'),
        to: '/home/agent/.claude/projects/-home-camille-www-api-tarifs',
      },
    ]);
  });
});
