import { Migration } from '@mikro-orm/migrations';

export class Migration20261107172330 extends Migration {

  override name = 'Migration20261107172330';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`session\` add column \`repo_root\` text null;`);
    this.addSql(`alter table \`session\` add column \`last_action\` text null;`);
    this.addSql(`alter table \`session\` add column \`cost_micros\` integer not null default 0;`);
    this.addSql(`alter table \`session\` add column \`unpriced_tokens\` integer not null default 0;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`session\` drop column \`repo_root\`;`);
    this.addSql(`alter table \`session\` drop column \`last_action\`;`);
    this.addSql(`alter table \`session\` drop column \`cost_micros\`;`);
    this.addSql(`alter table \`session\` drop column \`unpriced_tokens\`;`);
  }

}
