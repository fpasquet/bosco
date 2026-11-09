import { EntitySchema } from '@mikro-orm/core';

export interface NotificationRow {
  at: Date;
  excerpt: null | string;
  id: number;
  kind: string;
  place: null | string;
  readAt: Date | null;
  sessionId: null | string;
  settled: null | string;
  taskId: null | number;
  title: string;
  turnMinutes: null | number;
}

/** Notifications du centre de notifications (E15a), gardées 7 jours. */
export const NotificationSchema = new EntitySchema<NotificationRow>({
  name: 'Notification',
  tableName: 'notification',
  properties: {
    id: { type: 'integer', primary: true, autoincrement: true },
    kind: { type: 'string' },
    sessionId: { type: 'string', fieldName: 'session_id', nullable: true, index: true },
    taskId: { type: 'integer', fieldName: 'task_id', nullable: true },
    place: { type: 'string', nullable: true },
    title: { type: 'text' },
    excerpt: { type: 'text', nullable: true },
    turnMinutes: { type: 'integer', fieldName: 'turn_minutes', nullable: true },
    settled: { type: 'string', nullable: true },
    at: { type: 'datetime', index: true },
    readAt: { type: 'datetime', fieldName: 'read_at', nullable: true },
  },
});
