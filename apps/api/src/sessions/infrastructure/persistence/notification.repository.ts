import type { MikroORM } from '@mikro-orm/sqlite';
import type { NotificationRepository } from '../../application/notification.service.ts';
import type { NotificationKind, NotificationRecord } from '../../domain/notification.ts';
import { type NotificationRow, NotificationSchema } from './notification.schema.ts';

function recordOf(row: NotificationRow): NotificationRecord {
  return { ...row, kind: row.kind as NotificationKind };
}

/** Notifications du centre de notifications (E15a), dans leur table. */
export class MikroOrmNotificationRepository implements NotificationRepository {
  constructor(private readonly orm: MikroORM) {}

  async add(notification: Omit<NotificationRecord, 'id'>): Promise<NotificationRecord> {
    const em = this.orm.em.fork();
    const row = em.create(NotificationSchema, { ...notification });
    await em.flush();
    return recordOf(row);
  }

  async list(since: Date): Promise<NotificationRecord[]> {
    const rows = await this.orm.em
      .fork()
      .find(NotificationSchema, { at: { $gte: since } }, { orderBy: { at: 'desc', id: 'desc' } });
    return rows.map(recordOf);
  }

  async markRead(ids: null | number[], at: Date): Promise<void> {
    await this.orm.em
      .fork()
      .nativeUpdate(NotificationSchema, { readAt: null, ...(ids && { id: { $in: ids } }) }, { readAt: at });
  }

  async purge(before: Date): Promise<void> {
    await this.orm.em.fork().nativeDelete(NotificationSchema, { at: { $lt: before } });
  }

  settle(
    match: { kinds: readonly NotificationKind[]; sessionId?: string; taskId?: number },
    note: string,
  ): Promise<number> {
    return this.orm.em.fork().nativeUpdate(
      NotificationSchema,
      {
        settled: null,
        kind: { $in: [...match.kinds] },
        ...(match.sessionId !== undefined && { sessionId: match.sessionId }),
        ...(match.taskId !== undefined && { taskId: match.taskId }),
      },
      { settled: note },
    );
  }
}
