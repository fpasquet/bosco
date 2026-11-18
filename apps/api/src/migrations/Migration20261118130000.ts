import { Migration } from '@mikro-orm/migrations';

export class Migration20261118130000 extends Migration {
  override name = 'Migration20261118130000';

  override up(): void | Promise<void> {
    this.addSql(
      `create table \`profile_defaults\` (\`source_id\` text not null primary key, \`permission_mode\` text null, \`model\` text null, \`effort\` text null);`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`profile_defaults\`;`);
  }
}
