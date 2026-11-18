import { Migration } from '@mikro-orm/migrations';

export class Migration20261117230000 extends Migration {
  override name = 'Migration20261117230000';

  override up(): void | Promise<void> {
    // Les socles deviennent des groupes au prochain démarrage, une fois les dépôts découverts repris comme projets
    this.addSql("insert or ignore into `setting` (`key`, `value`) values ('groups.importSocles', 'pending');");
  }

  override down(): void | Promise<void> {
    this.addSql("delete from `setting` where `key` = 'groups.importSocles';");
  }
}
