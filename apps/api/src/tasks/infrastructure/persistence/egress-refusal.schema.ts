import { EntitySchema } from '@mikro-orm/core';
import type { EgressRefusal } from '../../domain/egress.ts';

/** Refus du proxy de sortie (E11b) : une ligne par tâche et par domaine, à l'heure du dernier essai. */
export const EgressRefusalSchema = new EntitySchema<EgressRefusal>({
  name: 'EgressRefusal',
  tableName: 'egress_refusal',
  properties: {
    taskId: { type: 'integer', primary: true, fieldName: 'task_id' },
    host: { type: 'string', primary: true },
    at: { type: 'datetime', index: true },
  },
});
