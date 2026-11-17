// Tables retirées : plus aucun code ne les écrit, mais les migrations ne retirent jamais rien. Les socles ont été
// repris en groupes une fois, au passage aux groupes ; la table reste telle quelle.
import { EntitySchema } from '@mikro-orm/core';

export interface SocleRow {
  id: number;
  inherits: null | number;
  name: string;
  projects: string[];
  scope: string;
}

/** Socles de décisions communes à plusieurs projets, remplacés par les groupes et leurs instructions. */
export const SocleSchema = new EntitySchema<SocleRow>({
  name: 'Socle',
  tableName: 'socle',
  properties: {
    id: { type: 'integer', primary: true, autoincrement: false },
    name: { type: 'string' },
    scope: { type: 'string' },
    inherits: { type: 'integer', nullable: true },
    projects: { type: 'json', fieldName: 'repositories' },
  },
});
