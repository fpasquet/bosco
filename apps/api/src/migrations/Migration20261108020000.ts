import { Migration } from '@mikro-orm/migrations';

export class Migration20261108020000 extends Migration {

  override name = 'Migration20261108020000';

  override up(): void | Promise<void> {
    this.addSql(`create table \`egress_refusal\` (\`task_id\` integer not null, \`host\` text not null, \`at\` datetime not null, primary key (\`task_id\`, \`host\`));`);
    this.addSql(`create index \`egress_refusal_at_index\` on \`egress_refusal\` (\`at\`);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`egress_refusal\`;`);
  }

}
