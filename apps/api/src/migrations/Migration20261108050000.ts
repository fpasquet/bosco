import { Migration } from '@mikro-orm/migrations';

export class Migration20261108050000 extends Migration {

  override name = 'Migration20261108050000';

  override up(): void | Promise<void> {
    this.addSql(`create table \`notification\` (\`id\` integer not null primary key autoincrement, \`kind\` text not null, \`session_id\` text null, \`task_id\` integer null, \`title\` text not null, \`excerpt\` text null, \`turn_minutes\` integer null, \`settled\` text null, \`at\` datetime not null, \`read_at\` datetime null);`);
    this.addSql(`create index \`notification_session_id_index\` on \`notification\` (\`session_id\`);`);
    this.addSql(`create index \`notification_at_index\` on \`notification\` (\`at\`);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`notification\`;`);
  }

}
