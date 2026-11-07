import { Migration } from '@mikro-orm/migrations';

export class Migration20261107210000 extends Migration {

  override name = 'Migration20261107210000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`session\` add column \`turns\` integer not null default 0;`);
    this.addSql(`alter table \`session\` add column \`changed_files\` json not null default '[]';`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`session\` drop column \`changed_files\`;`);
    this.addSql(`alter table \`session\` drop column \`turns\`;`);
  }

}
