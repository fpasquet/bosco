import { Migration } from '@mikro-orm/migrations';

export class Migration20261118100000 extends Migration {
  override name = 'Migration20261118100000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`project\` add column \`domains\` json not null default '[]';`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`project\` drop column \`domains\`;`);
  }
}
