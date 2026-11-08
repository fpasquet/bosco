import type { MikroORM } from '@mikro-orm/sqlite';
import type { AccountsStore, RepositoryAccounts } from '../../application/accounts.service.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';

/** Comptes propres à chaque dépôt (E8a), une clé par dépôt dans la table des réglages du poste. */
export class MikroOrmAccountsStore implements AccountsStore {
  constructor(private readonly orm: MikroORM) {}

  async of(repository: string): Promise<Partial<RepositoryAccounts>> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key: `accounts.repository.${repository}` });
    try {
      const parsed = JSON.parse(row?.value ?? '{}') as Record<string, unknown>;
      return {
        ...(typeof parsed.claudeProfile === 'string' && { claudeProfile: parsed.claudeProfile }),
        ...(typeof parsed.githubAccount === 'string' && { githubAccount: parsed.githubAccount }),
      };
    } catch {
      return {};
    }
  }

  async save(repository: string, accounts: Partial<RepositoryAccounts>): Promise<void> {
    await this.orm.em
      .fork()
      .upsert(SettingSchema, { key: `accounts.repository.${repository}`, value: JSON.stringify(accounts) });
  }
}
