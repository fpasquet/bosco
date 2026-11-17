import type { MikroORM } from '@mikro-orm/sqlite';
import type { TaskLink, TaskLinkStore } from '../../application/session.service.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';

const PREFIX = 'sessions.task.';

/** Lien d'une session du worker vers sa tâche, une clé par session dans la table des réglages du poste. */
export class MikroOrmTaskLinkStore implements TaskLinkStore {
  constructor(private readonly orm: MikroORM) {}

  async load(): Promise<Map<string, TaskLink>> {
    const rows = await this.orm.em.fork().find(SettingSchema, { key: { $like: `${PREFIX}%` } });
    return new Map(rows.map((row) => [row.key.slice(PREFIX.length), JSON.parse(row.value) as TaskLink]));
  }

  async save(sessionId: string, link: TaskLink): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key: `${PREFIX}${sessionId}`, value: JSON.stringify(link) });
  }
}
