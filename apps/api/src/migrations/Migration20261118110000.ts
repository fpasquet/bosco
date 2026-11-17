import { Migration } from '@mikro-orm/migrations';

export class Migration20261118110000 extends Migration {
  override name = 'Migration20261118110000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`pilot\` add column \`projects\` json not null default '[]';`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`pilot\` drop column \`projects\`;`);
  }
}
