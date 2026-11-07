import { Migration } from '@mikro-orm/migrations';

// Sessions sans titre de Claude Code : leur première demande en tient lieu, comme pour les sessions lues désormais.
export class Migration20261107190000 extends Migration {

  override name = 'Migration20261107190000';

  override up(): void | Promise<void> {
    this.addSql(`update \`session\` set \`title\` = (select \`e\`.\`text\` from \`session_event\` as \`e\` where \`e\`.\`session_id\` = \`session\`.\`id\` and \`e\`.\`kind\` = 'prompt' and ltrim(\`e\`.\`text\`) not like '<%' order by \`e\`.\`seq\` limit 1) where \`title\` is null;`);
  }

  override down(): void | Promise<void> {
    // Les titres repris de la première demande ne se distinguent plus des autres : rien à défaire
  }

}
