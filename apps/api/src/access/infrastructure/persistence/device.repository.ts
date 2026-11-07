import type { MikroORM } from '@mikro-orm/sqlite';
import type { AccessSettings, DeviceRepository } from '../../application/ports.ts';
import type { DeviceSnapshot } from '../../domain/device.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';
import { DeviceSchema } from './device.schema.ts';

export class MikroOrmDeviceRepository implements DeviceRepository {
  constructor(private readonly orm: MikroORM) {}

  findByTokenHash(tokenHash: string): Promise<DeviceSnapshot | null> {
    return this.orm.em.fork().findOne(DeviceSchema, { tokenHash });
  }

  list(): Promise<DeviceSnapshot[]> {
    return this.orm.em.fork().find(DeviceSchema, {}, { orderBy: { pairedAt: 'desc' } });
  }

  async remove(id: string): Promise<void> {
    await this.orm.em.fork().nativeDelete(DeviceSchema, { id });
  }

  async save(device: DeviceSnapshot): Promise<void> {
    await this.orm.em.fork().upsert(DeviceSchema, device);
  }
}

const PHONE_ENABLED = 'access.phoneEnabled';

/** Accès du téléphone activé ou non, dans la table des réglages du poste ; désactivé par défaut (CA-SESS-60). */
export class MikroOrmAccessSettings implements AccessSettings {
  constructor(private readonly orm: MikroORM) {}

  async load(): Promise<boolean> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key: PHONE_ENABLED });
    return row?.value === 'true';
  }

  async save(enabled: boolean): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key: PHONE_ENABLED, value: String(enabled) });
  }
}
