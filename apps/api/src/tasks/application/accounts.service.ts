import type { IsolationService } from './isolation.service.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';

/**
 * Comptes propres à un dépôt (E8a, lignes « Abonnement Claude » et « Compte GitHub ») : l'abonnement dont ses tâches
 * du worker prennent l'accès, et le compte GitHub avec lequel Bosco pousse leur branche, ouvre leur PR et lit leurs
 * liens. Sans valeur propre, le dépôt prend ceux par défaut de l'isolation du worker (E11b).
 */
export interface RepositoryAccounts {
  /** Profil Claude Code (son dossier) */
  claudeProfile: string;
  githubAccount: string;
}

export interface AccountsStore {
  of(repository: string): Promise<Partial<RepositoryAccounts>>;
  save(repository: string, accounts: Partial<RepositoryAccounts>): Promise<void>;
}

export class InvalidAccounts extends DomainError {
  constructor(message: string) {
    super('invalid_accounts', message);
  }
}

export interface ClaudeChoice {
  account: null | string;
  label: string;
  path: string;
}

/** Vue des comptes d'un dépôt : le défaut, la valeur du dépôt, l'effectif et son origine, les choix possibles. */
export interface AccountsView {
  claude: {
    choices: ClaudeChoice[];
    effective: ClaudeChoice | null;
    general: ClaudeChoice | null;
    origin: 'dépôt' | 'général';
    repository: ClaudeChoice | null;
  };
  github: {
    choices: string[];
    effective: null | string;
    general: null | string;
    origin: 'dépôt' | 'général';
    repository: null | string;
  };
}

/** Un changement : un profil ou un compte, ou null pour revenir au défaut. */
export type AccountsChanges = { [Field in keyof RepositoryAccounts]?: null | string };

export class AccountsService {
  constructor(
    private readonly store: AccountsStore,
    private readonly isolation: Pick<IsolationService, 'defaultGithubAccount' | 'snapshot'>,
  ) {}

  /** Comptes à utiliser pour une tâche de ce dépôt ; null : ceux par défaut. */
  async of(repository: string): Promise<{ claudeProfile: null | string; githubAccount: null | string }> {
    const own = await this.store.of(repository);
    return { claudeProfile: own.claudeProfile ?? null, githubAccount: own.githubAccount ?? null };
  }

  async view(repository: null | string): Promise<AccountsView> {
    const { secrets } = await this.isolation.snapshot();
    const own = repository ? await this.store.of(repository) : {};
    const choices = secrets.claude.choices;
    const general = choices.find(({ path }) => path === secrets.claude.profile) ?? null;
    const claude = own.claudeProfile
      ? (choices.find(({ path }) => path === own.claudeProfile) ?? {
          account: null,
          label: own.claudeProfile,
          path: own.claudeProfile,
        })
      : null;
    return {
      claude: {
        choices,
        effective: claude ?? general,
        general,
        origin: claude ? 'dépôt' : 'général',
        repository: claude,
      },
      github: {
        choices: secrets.github.choices,
        effective: own.githubAccount ?? secrets.github.account,
        general: secrets.github.account,
        origin: own.githubAccount ? 'dépôt' : 'général',
        repository: own.githubAccount ?? null,
      },
    };
  }

  async update(repository: string, changes: AccountsChanges): Promise<AccountsView> {
    const { secrets } = await this.isolation.snapshot();
    const next: Partial<RepositoryAccounts> = { ...(await this.store.of(repository)) };
    if (changes.claudeProfile !== undefined) {
      if (changes.claudeProfile === null) delete next.claudeProfile;
      else if (!secrets.claude.choices.some(({ path }) => path === changes.claudeProfile))
        throw new InvalidAccounts('Ce profil n’a pas d’accès à l’abonnement Claude : connecte-toi dans ce profil.');
      else next.claudeProfile = changes.claudeProfile;
    }
    if (changes.githubAccount !== undefined) {
      if (changes.githubAccount === null) delete next.githubAccount;
      else if (!secrets.github.choices.includes(changes.githubAccount))
        throw new InvalidAccounts('Ce compte n’est pas connecté à GitHub CLI sur le poste : gh auth login.');
      else next.githubAccount = changes.githubAccount;
    }
    await this.store.save(repository, next);
    return this.view(repository);
  }

  /**
   * Compte GitHub avec lequel agir pour ce dépôt : le sien, sinon celui choisi par défaut ; null pour le compte actif
   * de gh, sans jeton à passer.
   */
  async githubAccountOf(repository: string): Promise<null | string> {
    const own = await this.store.of(repository);
    return own.githubAccount ?? this.isolation.defaultGithubAccount();
  }
}
