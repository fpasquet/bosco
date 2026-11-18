// Ce que les scénarios ne voient pas : le journal d'une session, suspension d'« Approuver pour moi » comprise, se relit
// tel quel après un redémarrage de Bosco (une nouvelle connexion à la même base).
import { MikroORM } from '@mikro-orm/sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ormConfig } from './mikro-orm.config.ts';
import { Session } from './sessions/domain/session.ts';
import { MikroOrmSessionRepository } from './sessions/infrastructure/persistence/session.repository.ts';

const dirs: string[] = [];

async function open(file: string): Promise<MikroORM> {
  const orm = await MikroORM.init(ormConfig(file));
  await orm.migrator.up();
  return orm;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { force: true, recursive: true });
});

describe('MikroOrmSessionRepository', () => {
  it('reads the auto mode suspension of a session back after a restart, in the order of its journal', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bosco-journal-'));
    dirs.push(dir);
    const file = join(dir, 'bosco.db');
    const before = await open(file);
    const session = Session.discover('c41e9a07', 'pro', new Date('2026-11-18T14:50:00Z'));
    session.record({
      at: new Date('2026-11-18T14:50:00Z'),
      branch: 'main',
      cwd: '/home/dev/www/api-tarifs',
      kind: 'prompt',
      model: null,
      projectRoot: '/home/dev/www/api-tarifs',
      text: 'Nettoie le projet',
      usage: null,
    });
    session.noteAutoModeSuspended(3, false, new Date('2026-11-18T14:52:00Z'));
    await new MikroOrmSessionRepository(before).save(session, session.pullJournal());
    await before.close();

    const after = await open(file);
    const repository = new MikroOrmSessionRepository(after);
    const journal = await repository.journal('c41e9a07');
    const found = await repository.search('refus');
    await after.close();
    expect(journal).toEqual([
      { at: new Date('2026-11-18T14:50:00Z'), kind: 'prompt', seq: 1, text: 'Nettoie le projet' },
      { at: new Date('2026-11-18T14:52:00Z'), count: 3, kind: 'autoModeSuspended', seq: 2, total: false },
    ]);
    expect(found.size).toBe(0);
  });
});
