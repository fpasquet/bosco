import { Migration } from '@mikro-orm/migrations';

export class Migration20261108200000 extends Migration {

  override name = 'Migration20261108200000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`notification\` add column \`place\` text null;`);
  }

}
