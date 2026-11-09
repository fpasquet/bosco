import { Migration } from '@mikro-orm/migrations';

export class Migration20261108210000 extends Migration {
  override name = 'Migration20261108210000';

  override up(): void | Promise<void> {
    this.addSql(
      `create table \`pilot\` (\`session_id\` text not null primary key, \`source_id\` text not null, \`cwd\` text not null, \`settings\` json not null, \`since\` datetime not null);`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`pilot\`;`);
  }
}
