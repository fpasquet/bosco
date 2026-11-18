import type { MikroORM } from '@mikro-orm/sqlite';
import type { DatabaseStore } from '../../application/data.service.ts';

/** Efface chaque table de la base de Bosco ; la table des migrations reste, la base garde sa version. */
export class MikroOrmDatabaseEraser implements DatabaseStore {
  constructor(private readonly orm: MikroORM) {}

  async erase(): Promise<void> {
    await this.orm.schema.clear();
    // L'index de recherche n'est pas une entité : il se vide à part
    await this.orm.em.getConnection().execute('delete from session_search');
  }
}
