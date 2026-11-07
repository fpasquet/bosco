import { Migration } from '@mikro-orm/migrations';

export class Migration20261107233000 extends Migration {

  override name = 'Migration20261107233000';

  override up(): void | Promise<void> {
    this.addSql(`create table \`device\` (\`id\` text not null primary key, \`name\` text not null, \`paired_at\` datetime not null, \`token_hash\` text not null);`);
    this.addSql(`create unique index \`device_token_hash_unique\` on \`device\` (\`token_hash\`);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`device\`;`);
  }

}
