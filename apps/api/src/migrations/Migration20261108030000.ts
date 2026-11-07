import { Migration } from '@mikro-orm/migrations';

export class Migration20261108030000 extends Migration {

  override name = 'Migration20261108030000';

  override up(): void | Promise<void> {
    this.addSql(`create table \`decision\` (\`id\` integer not null primary key, \`state\` text not null, \`target\` json not null, \`exception_to\` integer null, \`from_task\` integer null, \`reason\` text null, \`replaced_by\` integer null, \`specifies\` json not null, \`versions\` json not null);`);
    this.addSql(`create index \`decision_state_index\` on \`decision\` (\`state\`);`);

    this.addSql(`create table \`socle\` (\`id\` integer not null primary key, \`name\` text not null, \`scope\` text not null, \`inherits\` integer null, \`repositories\` json not null);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`decision\`;`);
    this.addSql(`drop table if exists \`socle\`;`);
  }

}
