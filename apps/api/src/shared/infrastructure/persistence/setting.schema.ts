import { EntitySchema } from '@mikro-orm/core';

/** Réglage du poste (délai d'inactivité, regroupement…), rangé par clé ; le domaine n'en voit que les valeurs. */
export interface SettingRow {
  key: string;
  value: string;
}

export const SettingSchema = new EntitySchema<SettingRow>({
  name: 'Setting',
  tableName: 'setting',
  properties: {
    key: { type: 'string', primary: true },
    value: { type: 'string' },
  },
});
