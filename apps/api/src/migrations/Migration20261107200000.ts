import { Migration } from '@mikro-orm/migrations';

export class Migration20261107200000 extends Migration {

  override name = 'Migration20261107200000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`session\` add column \`waiting\` json null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`session\` drop column \`waiting\`;`);
  }

}
