import { Migration } from '@mikro-orm/migrations';

export class Migration20261118170000 extends Migration {
  override name = 'Migration20261118170000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`pilot\` add column \`context\` text null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`pilot\` drop column \`context\`;`);
  }
}
