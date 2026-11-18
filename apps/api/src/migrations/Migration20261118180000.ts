import { Migration } from '@mikro-orm/migrations';

export class Migration20261118180000 extends Migration {
  override name = 'Migration20261118180000';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`session\` add column \`subagent_input_tokens\` integer not null default 0;`);
    this.addSql(`alter table \`session\` add column \`subagent_output_tokens\` integer not null default 0;`);
    this.addSql(`alter table \`session\` add column \`subagent_cache_creation_tokens\` integer not null default 0;`);
    this.addSql(`alter table \`session\` add column \`subagent_cache_read_tokens\` integer not null default 0;`);
    this.addSql(`alter table \`session\` add column \`subagent_cost_micros\` integer not null default 0;`);
    this.addSql(`alter table \`session_turn\` add column \`subagent\` integer not null default false;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`session_turn\` drop column \`subagent\`;`);
    this.addSql(`alter table \`session\` drop column \`subagent_cost_micros\`;`);
    this.addSql(`alter table \`session\` drop column \`subagent_cache_read_tokens\`;`);
    this.addSql(`alter table \`session\` drop column \`subagent_cache_creation_tokens\`;`);
    this.addSql(`alter table \`session\` drop column \`subagent_output_tokens\`;`);
    this.addSql(`alter table \`session\` drop column \`subagent_input_tokens\`;`);
  }
}
