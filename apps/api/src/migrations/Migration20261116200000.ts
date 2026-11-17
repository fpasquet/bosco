import { Migration } from '@mikro-orm/migrations';

export class Migration20261116200000 extends Migration {
  override name = 'Migration20261116200000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`pilot\` add column \`sandbox\` json null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`pilot\` drop column \`sandbox\`;`);
  }
}
