// Ce que les scénarios ne voient pas : processus mort, fichier en cours d'écriture, profil sans registre.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Source } from '../../domain/source.ts';
import { FileSessionRegistry } from './session-registry.ts';

const ALIVE = 8066;
const registries: FileSessionRegistry[] = [];

function profile(): { path: string; source: Source } {
  const path = mkdtempSync(join(tmpdir(), 'bosco-registry-'));
  return { path, source: Source.choose('pro', path, true) };
}

function register(path: string, pid: number, sessionId: string, content?: string): void {
  mkdirSync(join(path, 'sessions'), { recursive: true });
  writeFileSync(join(path, 'sessions', `${pid}.json`), content ?? JSON.stringify({ pid, sessionId, status: 'busy' }));
}

function registry(): FileSessionRegistry {
  const created = new FileSessionRegistry((pid) => pid === ALIVE, 10);
  registries.push(created);
  return created;
}

afterEach(() => {
  for (const created of registries.splice(0)) created.close();
});

describe('FileSessionRegistry', () => {
  it('holds open the sessions of a live process only', async () => {
    const { path, source } = profile();
    register(path, ALIVE, 'b63b3130');
    register(path, 4242, '8b95ad0f');
    const sessions = registry();
    await sessions.watch(source, () => undefined);
    expect([sessions.isOpen('pro', 'b63b3130'), sessions.isOpen('pro', '8b95ad0f')]).toEqual([true, false]);
    rmSync(path, { recursive: true });
  });

  it('knows nothing of a profile without registry', async () => {
    const { path, source } = profile();
    const sessions = registry();
    await sessions.watch(source, () => undefined);
    expect(sessions.isOpen('pro', 'b63b3130')).toBeNull();
    rmSync(path, { recursive: true });
  });

  it('reports a session that closes, and waits for a file being written', async () => {
    const { path, source } = profile();
    register(path, ALIVE, 'b63b3130');
    const changed = vi.fn();
    const sessions = registry();
    await sessions.watch(source, changed);
    changed.mockClear();
    register(path, ALIVE, 'b63b3130', '{"pid": 80');
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect([sessions.isOpen('pro', 'b63b3130'), changed.mock.calls.length]).toEqual([true, 0]);
    rmSync(join(path, 'sessions', `${ALIVE}.json`));
    await vi.waitFor(() => expect(changed).toHaveBeenCalledWith(['b63b3130']));
    expect(sessions.isOpen('pro', 'b63b3130')).toBe(false);
    rmSync(path, { recursive: true });
  });
});
