import { Migration } from '@mikro-orm/migrations';

export class Migration20261108010000 extends Migration {

  override name = 'Migration20261108010000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`task\` add column \`outcome\` json not null default '{}';`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`task\` drop column \`outcome\`;`);
  }

}
