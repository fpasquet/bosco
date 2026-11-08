import type { MikroORM } from '@mikro-orm/sqlite';
import type { SettingsRepository } from '../../application/ports.ts';
import type { SettingsSnapshot } from '../../domain/settings.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';

/** Réglages des sessions dans la table des réglages du poste, une clé par valeur. */
const KEYS = { desktopNotifications: 'sessions.desktopNotifications', inactivityMinutes: 'sessions.inactivityMinutes' };

export class MikroOrmSettingsRepository implements SettingsRepository {
  constructor(private readonly orm: MikroORM) {}

  async load(): Promise<null | SettingsSnapshot> {
    const rows = await this.orm.em.fork().find(SettingSchema, { key: { $in: Object.values(KEYS) } });
    if (rows.length === 0) return null;
    const value = (key: string) => rows.find((row) => row.key === key)?.value;
    const minutes = Number(value(KEYS.inactivityMinutes));
    const notifications = value(KEYS.desktopNotifications);
    return {
      inactivityMinutes: Number.isInteger(minutes) && minutes > 0 ? minutes : 15,
      desktopNotifications: notifications === undefined ? true : notifications === 'true',
    };
  }

  async save(settings: SettingsSnapshot): Promise<void> {
    const em = this.orm.em.fork();
    await em.upsert(SettingSchema, { key: KEYS.inactivityMinutes, value: String(settings.inactivityMinutes) });
    await em.upsert(SettingSchema, { key: KEYS.desktopNotifications, value: String(settings.desktopNotifications) });
  }
}
