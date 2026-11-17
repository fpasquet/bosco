// Ce que les scénarios ne voient pas : la reprise d'une session du worker dans un autre profil.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findSession, installSession } from './resume.ts';

describe('resume', () => {
  it('copies the session of the worker profile into the chosen profile, and gives its folder', async () => {
    const root = mkdtempSync(join(tmpdir(), 'bosco-resume-'));
    const worker = join(root, 'worker');
    mkdirSync(join(worker, 'projects', '-home-dev-api-voix'), { recursive: true });
    const line = JSON.stringify({ sessionId: 'a41f07c2', cwd: '/home/dev/api-voix', type: 'user' });
    writeFileSync(join(worker, 'projects', '-home-dev-api-voix', 'a41f07c2.jsonl'), `${line}\n`);
    const found = await findSession(worker, 'a41f07c2');
    expect(found?.dir).toBe('-home-dev-api-voix');
    const cwd = await installSession(found!, join(root, '.claude'), 'a41f07c2');
    expect(cwd).toBe('/home/dev/api-voix');
    expect(readFileSync(join(root, '.claude', 'projects', '-home-dev-api-voix', 'a41f07c2.jsonl'), 'utf8')).toBe(
      `${line}\n`,
    );
  });
});
