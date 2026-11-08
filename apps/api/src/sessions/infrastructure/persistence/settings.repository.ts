import type { MikroORM } from '@mikro-orm/sqlite';
import type { SettingsRepository } from '../../application/ports.ts';
import type { NotificationSettings } from '../../domain/notification.ts';
import type { DiscoverySnapshot } from '../../domain/repository-discovery.ts';
import type { SettingsChanges, SettingsSnapshot } from '../../domain/settings.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';

/** Réglages des sessions dans la table des réglages du poste, une clé par valeur. */
const KEYS = {
  desktopNotifications: 'sessions.desktopNotifications',
  inactivityMinutes: 'sessions.inactivityMinutes',
  notifications: 'sessions.notifications',
  repositories: 'sessions.repositories',
};

export class MikroOrmSettingsRepository implements SettingsRepository {
  constructor(private readonly orm: MikroORM) {}

  async load(): Promise<null | SettingsChanges> {
    const rows = await this.orm.em.fork().find(SettingSchema, { key: { $in: Object.values(KEYS) } });
    if (rows.length === 0) return null;
    const value = (key: string) => rows.find((row) => row.key === key)?.value;
    const minutes = Number(value(KEYS.inactivityMinutes));
    const desktop = value(KEYS.desktopNotifications);
    const repositories = discovery(value(KEYS.repositories));
    const notifications = notificationSettings(value(KEYS.notifications));
    return {
      inactivityMinutes: Number.isInteger(minutes) && minutes > 0 ? minutes : 15,
      desktopNotifications: desktop === undefined ? true : desktop === 'true',
      ...(repositories && { repositories }),
      ...(notifications && { notifications }),
    };
  }

  async save(settings: SettingsSnapshot): Promise<void> {
    const em = this.orm.em.fork();
    await em.upsert(SettingSchema, { key: KEYS.inactivityMinutes, value: String(settings.inactivityMinutes) });
    await em.upsert(SettingSchema, { key: KEYS.desktopNotifications, value: String(settings.desktopNotifications) });
    await em.upsert(SettingSchema, { key: KEYS.repositories, value: JSON.stringify(settings.repositories) });
    await em.upsert(SettingSchema, { key: KEYS.notifications, value: JSON.stringify(settings.notifications) });
  }
}

/** Réglages des dépôts gardés en JSON ; une valeur illisible laisse les réglages par défaut. */
function discovery(value: string | undefined): null | Partial<DiscoverySnapshot> {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    const strings = (key: string) =>
      Array.isArray(record[key]) && record[key].every((item) => typeof item === 'string') ? { [key]: record[key] } : {};
    const flag = (key: string) => (typeof record[key] === 'boolean' ? { [key]: record[key] } : {});
    return {
      ...flag('gitOnly'),
      ...flag('attachWorktrees'),
      ...strings('roots'),
      ...strings('excluded'),
      ...strings('hidden'),
    };
  } catch {
    return null;
  }
}

/** Réglages des notifications gardés en JSON ; une valeur illisible ou inconnue garde celle par défaut. */
function notificationSettings(value: string | undefined): null | Partial<NotificationSettings> {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const kept: Partial<NotificationSettings> = {};
    for (const key of [
      'ended',
      'failed',
      'inAppWhenForeground',
      'permission',
      'question',
      'review',
      'turnQuestion',
    ] as const)
      if (typeof parsed[key] === 'boolean') kept[key] = parsed[key];
    if (parsed.turn === 'always' || parsed.turn === 'long' || parsed.turn === 'never') kept.turn = parsed.turn;
    if (typeof parsed.longTurnMinutes === 'number') kept.longTurnMinutes = parsed.longTurnMinutes;
    return kept;
  } catch {
    return null;
  }
}
