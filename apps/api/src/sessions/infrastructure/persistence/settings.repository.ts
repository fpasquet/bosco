import type { MikroORM } from '@mikro-orm/sqlite';
import type { SettingsRepository } from '../../application/ports.ts';
import type { DiscoverySnapshot } from '../../domain/repository-discovery.ts';
import type { SettingsChanges, SettingsSnapshot } from '../../domain/settings.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';

/** Réglages des sessions dans la table des réglages du poste, une clé par valeur. */
const KEYS = {
  desktopNotifications: 'sessions.desktopNotifications',
  inactivityMinutes: 'sessions.inactivityMinutes',
  repositories: 'sessions.repositories',
};

export class MikroOrmSettingsRepository implements SettingsRepository {
  constructor(private readonly orm: MikroORM) {}

  async load(): Promise<null | SettingsChanges> {
    const rows = await this.orm.em.fork().find(SettingSchema, { key: { $in: Object.values(KEYS) } });
    if (rows.length === 0) return null;
    const value = (key: string) => rows.find((row) => row.key === key)?.value;
    const minutes = Number(value(KEYS.inactivityMinutes));
    const notifications = value(KEYS.desktopNotifications);
    const repositories = discovery(value(KEYS.repositories));
    return {
      inactivityMinutes: Number.isInteger(minutes) && minutes > 0 ? minutes : 15,
      desktopNotifications: notifications === undefined ? true : notifications === 'true',
      ...(repositories && { repositories }),
    };
  }

  async save(settings: SettingsSnapshot): Promise<void> {
    const em = this.orm.em.fork();
    await em.upsert(SettingSchema, { key: KEYS.inactivityMinutes, value: String(settings.inactivityMinutes) });
    await em.upsert(SettingSchema, { key: KEYS.desktopNotifications, value: String(settings.desktopNotifications) });
    await em.upsert(SettingSchema, { key: KEYS.repositories, value: JSON.stringify(settings.repositories) });
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
