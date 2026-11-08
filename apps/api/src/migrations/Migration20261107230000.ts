import { Migration } from '@mikro-orm/migrations';

// Recherche de l'historique (DT-04, E3a) : un index FTS5 du journal des sessions, que le dépôt des sessions alimente.
export class Migration20261107230000 extends Migration {

  override name = 'Migration20261107230000';

  override up(): void | Promise<void> {
    this.addSql(`create virtual table \`session_search\` using fts5(\`session_id\` unindexed, \`text\`, tokenize = 'unicode61 remove_diacritics 2');`);
    this.addSql(`insert into \`session_search\` (\`session_id\`, \`text\`) select \`session_id\`, \`text\` from \`session_event\`;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`session_search\`;`);
  }

}
