import { Migration } from '@mikro-orm/migrations';

export class Migration20261107000000 extends Migration {
  override up(): void {
    this.addSql('create table `setting` (`key` text not null primary key, `value` text not null);');
  }

  override down(): void {
    this.addSql('drop table if exists `setting`;');
  }
}
