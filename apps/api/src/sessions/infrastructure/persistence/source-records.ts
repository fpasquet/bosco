import type { MikroORM } from '@mikro-orm/sqlite';
import type { SourceRecords } from '../../application/ports.ts';

/** Tables rattachées à une session par sa colonne session_id, effacées avec elle. */
const SESSION_TABLES = ['session_turn', 'session_pull_request', 'session_event', 'session_search', 'notification'];

/**
 * Ce que Bosco garde d'une source dans sa base : ses sessions et tout ce qui s'y rattache, les positions de lecture de
 * ses transcripts et ses valeurs par défaut. Rien n'est jamais effacé dans le dossier du profil.
 */
export class MikroOrmSourceRecords implements SourceRecords {
  constructor(private readonly orm: MikroORM) {}

  async countSessions(sourceId?: string): Promise<{ count: number; oldestAt: Date | null }> {
    const connection = this.orm.em.getConnection();
    const where = sourceId === undefined ? '' : ' where source_id = ?';
    const rows = await connection.execute<{ count: number; oldest: null | number | string }[]>(
      `select count(*) as count, min(started_at) as oldest from session${where}`,
      sourceId === undefined ? [] : [sourceId],
    );
    const [row] = rows;
    return { count: Number(row?.count ?? 0), oldestAt: row?.oldest == null ? null : new Date(row.oldest) };
  }

  async sessionIds(sourceId: string): Promise<string[]> {
    const rows = await this.orm.em
      .getConnection()
      .execute<{ id: string }[]>('select id from session where source_id = ?', [sourceId]);
    return rows.map(({ id }) => id);
  }

  async forget(source: { id: string; path: string }): Promise<void> {
    await this.orm.em.fork().transactional(async (tx) => {
      const connection = tx.getConnection();
      // Chaque requête passe par la transaction : SQLite n'a qu'un écrivain à la fois
      const run = (sql: string, params: unknown[]) =>
        connection.execute(sql, params, 'run', tx.getTransactionContext());
      const sessions = 'select id from session where source_id = ?';
      for (const table of SESSION_TABLES)
        await run(`delete from ${table} where session_id in (${sessions})`, [source.id]);
      await run(`delete from pilot where source_id = ? or session_id in (${sessions})`, [source.id, source.id]);
      await run('delete from session where source_id = ?', [source.id]);
      // Les positions de lecture des transcripts du dossier : un retour du profil relit son historique
      await run("delete from transcript_cursor where path like ? escape '\\'", [`${escapeLike(source.path)}/%`]);
      await run('delete from profile_defaults where source_id = ?', [source.id]);
      await run('delete from source where id = ?', [source.id]);
    });
  }
}

function escapeLike(value: string): string {
  return value.replaceAll(/[\\%_]/g, (character) => `\\${character}`);
}
