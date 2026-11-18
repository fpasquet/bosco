import { Migration } from '@mikro-orm/migrations';

export class Migration20261118160000 extends Migration {
  override name = 'Migration20261118160000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`notification\` add column \`decision_id\` integer null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`notification\` drop column \`decision_id\`;`);
  }
}
