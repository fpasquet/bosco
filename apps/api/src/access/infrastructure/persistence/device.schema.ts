import { EntitySchema } from '@mikro-orm/core';
import type { DeviceSnapshot } from '../../domain/device.ts';

/** Téléphone appairé : seule l'empreinte de son jeton est gardée. */
export const DeviceSchema = new EntitySchema<DeviceSnapshot>({
  name: 'Device',
  tableName: 'device',
  properties: {
    id: { type: 'string', primary: true },
    name: { type: 'string' },
    pairedAt: { type: 'datetime', fieldName: 'paired_at' },
    tokenHash: { type: 'string', fieldName: 'token_hash', unique: true },
  },
});
