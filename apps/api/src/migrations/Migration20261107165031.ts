import { Migration } from '@mikro-orm/migrations';

export class Migration20261107165031 extends Migration {

  override name = 'Migration20261107165031';

  override up(): void | Promise<void> {
    this.addSql(`create table \`session\` (\`id\` text not null primary key, \`source_id\` text not null, \`repo_path\` text null, \`branch\` text null, \`title\` text null, \`model\` text null, \`started_at\` datetime not null, \`last_event_at\` datetime not null, \`last_message\` text null, \`input_tokens\` integer not null, \`output_tokens\` integer not null, \`cache_creation_tokens\` integer not null, \`cache_read_tokens\` integer not null, \`next_seq\` integer not null);`);
    this.addSql(`create index \`session_source_id_index\` on \`session\` (\`source_id\`);`);
    this.addSql(`create index \`session_last_event_at_index\` on \`session\` (\`last_event_at\`);`);

    this.addSql(`create table \`session_event\` (\`session_id\` text not null, \`seq\` integer not null, \`at\` datetime not null, \`kind\` text not null, \`text\` text not null, primary key (\`session_id\`, \`seq\`));`);

    this.addSql(`create table \`source\` (\`id\` text not null primary key, \`path\` text not null, \`label\` text not null, \`watched\` integer not null, \`live_tracking\` integer not null);`);
    this.addSql(`create unique index \`source_path_unique\` on \`source\` (\`path\`);`);

    this.addSql(`create table \`transcript_cursor\` (\`path\` text not null primary key, \`offset\` integer not null);`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`session\`;`);
    this.addSql(`drop table if exists \`session_event\`;`);
    this.addSql(`drop table if exists \`source\`;`);
    this.addSql(`drop table if exists \`transcript_cursor\`;`);
  }

}
