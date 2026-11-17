import { Migration } from '@mikro-orm/migrations';

export class Migration20261117202824 extends Migration {
  override name = 'Migration20261117202824';

  override up(): void | Promise<void> {
    this.addSql(
      `create table \`ignored_folder\` (\`path\` text not null primary key, \`ignored_at\` datetime not null);`,
    );

    this.addSql(
      `create table \`project\` (\`id\` integer not null primary key, \`path\` text not null, \`name\` text not null, \`git\` integer not null, \`pinned\` integer not null default false, \`added_at\` datetime not null);`,
    );
    this.addSql(`create unique index \`project_path_unique\` on \`project\` (\`path\`);`);
    this.addSql(`create unique index \`project_name_unique\` on \`project\` (\`name\`);`);
    // Les dépôts découverts deviennent des projets au prochain démarrage : il faut git pour suivre les worktrees
    this.addSql("insert or ignore into `setting` (`key`, `value`) values ('projects.importDiscovered', 'pending');");
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`ignored_folder\`;`);
    this.addSql(`drop table if exists \`project\`;`);
    this.addSql("delete from `setting` where `key` = 'projects.importDiscovered';");
  }
}
