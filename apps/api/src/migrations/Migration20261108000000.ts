import { Migration } from '@mikro-orm/migrations';

export class Migration20261108000000 extends Migration {

  override name = 'Migration20261108000000';

  override up(): void | Promise<void> {
    this.addSql(`create table \`task\` (\`id\` integer not null primary key, \`repository_name\` text not null, \`repository_root\` text not null, \`folder\` text not null, \`instruction\` text not null, \`mode\` text not null, \`state\` text not null, \`context\` text null, \`created_by\` text not null, \`failure\` text null, \`guardrails\` json not null, \`prerequisites\` json not null, \`log\` json not null, \`spent_usd\` double not null, \`created_at\` datetime not null, \`updated_at\` datetime not null);`);
    this.addSql(`create index \`task_repository_name_index\` on \`task\` (\`repository_name\`);`);
    this.addSql(`create index \`task_state_index\` on \`task\` (\`state\`);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`task\`;`);
  }

}
