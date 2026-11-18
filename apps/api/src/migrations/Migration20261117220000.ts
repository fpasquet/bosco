import { Migration } from '@mikro-orm/migrations';

export class Migration20261117220000 extends Migration {
  override name = 'Migration20261117220000';

  override up(): void | Promise<void> {
    this.addSql(
      `create table \`group_project\` (\`group_id\` integer not null, \`project_id\` integer not null, \`rank\` integer not null, primary key (\`group_id\`, \`project_id\`));`,
    );
    this.addSql(`create index \`group_project_project_id_index\` on \`group_project\` (\`project_id\`);`);

    this.addSql(
      `create table \`project_group\` (\`id\` integer not null primary key, \`name\` text not null, \`description\` text null, \`instructions\` text not null default '', \`profile\` text null, \`sidebar\` integer not null default true, \`system\` integer not null default false);`,
    );
    this.addSql(`create unique index \`project_group_name_unique\` on \`project_group\` (\`name\`);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`group_project\`;`);
    this.addSql(`drop table if exists \`project_group\`;`);
  }
}
