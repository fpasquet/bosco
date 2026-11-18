import { Migration } from '@mikro-orm/migrations';

export class Migration20261118120000 extends Migration {
  override name = 'Migration20261118120000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`project\` add column \`profile\` text null;`);
    this.addSql(`alter table \`project\` add column \`permission_mode\` text null;`);
    this.addSql(`alter table \`project\` add column \`model\` text null;`);
    this.addSql(`alter table \`project\` add column \`effort\` text null;`);
    this.addSql(`alter table \`project_group\` add column \`permission_mode\` text null;`);
    this.addSql(`alter table \`project_group\` add column \`model\` text null;`);
    this.addSql(`alter table \`project_group\` add column \`effort\` text null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`project_group\` drop column \`effort\`;`);
    this.addSql(`alter table \`project_group\` drop column \`model\`;`);
    this.addSql(`alter table \`project_group\` drop column \`permission_mode\`;`);
    this.addSql(`alter table \`project\` drop column \`effort\`;`);
    this.addSql(`alter table \`project\` drop column \`model\`;`);
    this.addSql(`alter table \`project\` drop column \`permission_mode\`;`);
    this.addSql(`alter table \`project\` drop column \`profile\`;`);
  }
}
