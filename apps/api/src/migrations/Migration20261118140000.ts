import { Migration } from '@mikro-orm/migrations';

export class Migration20261118140000 extends Migration {
  override name = 'Migration20261118140000';

  override up(): void | Promise<void> {
    this.addSql(
      `create table \`session_pull_request\` (\`url\` text not null primary key, \`session_id\` text not null, \`at\` datetime not null);`,
    );
    this.addSql(`create index \`session_pull_request_session_id_index\` on \`session_pull_request\` (\`session_id\`);`);
    this.addSql(`create index \`session_pull_request_at_index\` on \`session_pull_request\` (\`at\`);`);

    this.addSql(
      `create table \`session_turn\` (\`id\` integer not null primary key autoincrement, \`session_id\` text not null, \`at\` datetime not null, \`model\` text null, \`input_tokens\` integer not null, \`output_tokens\` integer not null, \`cache_creation_tokens\` integer not null, \`cache_read_tokens\` integer not null);`,
    );
    this.addSql(`create index \`session_turn_session_id_index\` on \`session_turn\` (\`session_id\`);`);
    this.addSql(`create index \`session_turn_at_index\` on \`session_turn\` (\`at\`);`);

    // Les sessions déjà lues n'ont pas l'usage de leurs tours : il sera relu dans leur transcript
    this.addSql(`alter table \`session\` add column \`usage_complete\` integer not null default false;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`session_pull_request\`;`);
    this.addSql(`drop table if exists \`session_turn\`;`);
    this.addSql(`alter table \`session\` drop column \`usage_complete\`;`);
  }
}
