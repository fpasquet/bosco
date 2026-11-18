import { Migration } from '@mikro-orm/migrations';

export class Migration20261118190000 extends Migration {
  override name = 'Migration20261118190000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`source\` add column \`token_file\` text null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`source\` drop column \`token_file\`;`);
  }
}
