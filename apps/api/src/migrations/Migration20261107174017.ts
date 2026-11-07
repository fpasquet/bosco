import { Migration } from '@mikro-orm/migrations';

export class Migration20261107174017 extends Migration {

  override name = 'Migration20261107174017';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`session\` add column \`recent_actions\` json not null default '[]';`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`session\` drop column \`recent_actions\`;`);
  }

}
