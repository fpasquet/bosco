import { Migration } from '@mikro-orm/migrations';

export class Migration20261118150000 extends Migration {
  override name = 'Migration20261118150000';

  override up(): void | Promise<void> {
    // Toutes les sources existantes sont des profils ; celle des bacs à sable est reprise à part au démarrage suivant
    this.addSql(`alter table \`source\` add column \`managed\` integer not null default false;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`source\` drop column \`managed\`;`);
  }
}
