import { Migration } from '@mikro-orm/migrations';

export class Migration20261118090000 extends Migration {
  override name = 'Migration20261118090000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`project\` add column \`place\` text null;`);
    this.addSql(`alter table \`project\` add column \`start_branch\` text null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`project\` drop column \`place\`;`);
    this.addSql(`alter table \`project\` drop column \`start_branch\`;`);
  }
}
