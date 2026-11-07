import { Migration } from '@mikro-orm/migrations';

export class Migration20261107203000 extends Migration {

  override name = 'Migration20261107203000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`session\` add column \`ended_at\` datetime null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`session\` drop column \`ended_at\`;`);
  }

}
