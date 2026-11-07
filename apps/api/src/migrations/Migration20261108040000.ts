import { Migration } from '@mikro-orm/migrations';

export class Migration20261108040000 extends Migration {

  override name = 'Migration20261108040000';

  override up(): void | Promise<void> {
    this.addSql(`create table \`link\` (\`id\` integer not null primary key, \`task_id\` integer not null, \`url\` text not null, \`service\` text not null, \`kind\` text not null, \`title\` text not null, \`state\` text null, \`person\` text null, \`read_at\` datetime null, \`error\` text null);`);
    this.addSql(`create index \`link_task_id_index\` on \`link\` (\`task_id\`);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`link\`;`);
  }

}
