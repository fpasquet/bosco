import { DomainError } from '../../shared/domain/domain-error.ts';
import { allows, isDomain, LOCKED_DOMAINS } from '../domain/egress.ts';

/** Domaines ajoutés et abonnement par défaut, rangés dans la base de Bosco. */
export interface IsolationStore {
  addedDomains(): Promise<string[]>;
  saveAddedDomains(domains: readonly string[]): Promise<void>;
  saveSubscription(profile: null | string): Promise<void>;
  subscription(): Promise<null | string>;
}

/** Profils Claude Code du poste et leur accès à l'abonnement ; rien n'est jamais montré des jetons eux-mêmes. */
export interface ClaudeProfiles {
  /** Compte de l'abonnement d'un profil et son fichier d'accès, s'il en a un */
  account(profile: string): Promise<{ account: null | string; credentials: null | string }>;
  /** Le fichier existe sur le poste */
  exists(path: string): Promise<boolean>;
  /** Profils Claude Code surveillés */
  profiles(): Promise<{ label: string; path: string }[]>;
}

/** Liste lue par le proxy de chaque bac à sable à chaque connexion : un changement vaut tout de suite. */
export interface AllowListPublisher {
  publish(domains: readonly string[]): Promise<void>;
}

/** Réglage refusé ; son message s'affiche tel quel sous le champ. */
export class InvalidIsolation extends DomainError {
  constructor(message: string) {
    super('invalid_isolation', message);
  }
}

/** Abonnement par défaut tel que les réglages le montrent : celui choisi, son compte, et les choix possibles. */
export interface SubscriptionView {
  account: null | string;
  /** Un accès à l'abonnement existe : sans lui, aucun bac à sable ne démarre */
  available: boolean;
  choices: { account: null | string; label: string; path: string }[];
  label: null | string;
  profile: null | string;
}

export interface IsolationSnapshot {
  added: string[];
  locked: string[];
  subscription: SubscriptionView;
}

/**
 * Isolation des bacs à sable : la liste des domaines que joint le proxy de sortie, et l'abonnement Claude
 * par défaut, dont l'accès est copié dans un bac à sable qui n'en choisit pas d'autre.
 */
export class IsolationService {
  private added: string[] = [];
  private chosen: null | string = null;

  constructor(
    private readonly store: IsolationStore,
    private readonly publisher: AllowListPublisher,
    private readonly claude: { defaults: { credentials: string }; profiles: ClaudeProfiles },
  ) {}

  async load(): Promise<void> {
    this.added = await this.store.addedDomains();
    this.chosen = await this.store.subscription();
    await this.publish();
  }

  /** Accès à l'abonnement d'un profil, copié dans un bac à sable ; celui par défaut sans profil. */
  async credentialsOf(profile: null | string = null): Promise<string> {
    const chosen = profile ?? this.chosen;
    const account = chosen ? await this.claude.profiles.account(chosen) : null;
    return account?.credentials ?? this.claude.defaults.credentials;
  }

  /** Profils Claude qui ont un accès à un abonnement : ceux dont le quota se montre. */
  subscriptions(): Promise<{ label: string; path: string }[]> {
    return this.claude.profiles.profiles();
  }

  /** Profil d'un abonnement : celui donné, sinon celui par défaut, sinon celui de l'accès de la configuration. */
  profileOf(profile: null | string): string {
    const credentials = this.claude.defaults.credentials;
    return profile ?? this.chosen ?? credentials.slice(0, credentials.lastIndexOf('/'));
  }

  /** Abonnement par défaut, choisi parmi les profils surveillés qui ont un accès. */
  async setSubscription(profile: null | string): Promise<IsolationSnapshot> {
    if (profile) {
      const profiles = await this.claude.profiles.profiles();
      const { credentials } = await this.claude.profiles.account(profile);
      if (!profiles.some(({ path }) => path === profile) || !credentials)
        throw new InvalidIsolation('Choisis un profil surveillé qui a un accès à l’abonnement Claude.');
    }
    this.chosen = profile;
    await this.store.saveSubscription(profile);
    return this.snapshot();
  }

  allowList(): string[] {
    return [...LOCKED_DOMAINS, ...this.added];
  }

  async snapshot(): Promise<IsolationSnapshot> {
    return { locked: [...LOCKED_DOMAINS], added: [...this.added], subscription: await this.subscriptionView() };
  }

  /** Un nom de domaine, ou « *. » et un nom ; ajouté sans relancer les bacs à sable. */
  async addDomain(value: string): Promise<IsolationSnapshot> {
    const domain = value.trim().toLowerCase();
    if (!isDomain(domain))
      throw new InvalidIsolation('Un nom de domaine seul, sans protocole ni chemin : pypi.org ou *.github.com.');
    if (allows(this.allowList(), domain) && this.allowList().includes(domain))
      throw new InvalidIsolation(`${domain} est déjà dans la liste.`);
    this.added = [...this.added, domain];
    await this.store.saveAddedDomains(this.added);
    await this.publish();
    return this.snapshot();
  }

  /** Seul un domaine ajouté se retire : la liste par défaut est verrouillée. */
  async removeDomain(value: string): Promise<IsolationSnapshot> {
    const domain = value.trim().toLowerCase();
    if ((LOCKED_DOMAINS as readonly string[]).includes(domain))
      throw new InvalidIsolation(`${domain} est nécessaire à Claude Code et aux installations : il reste autorisé.`);
    this.added = this.added.filter((added) => added !== domain);
    await this.store.saveAddedDomains(this.added);
    await this.publish();
    return this.snapshot();
  }

  private async publish(): Promise<void> {
    await this.publisher.publish(this.allowList());
  }

  private async subscriptionView(): Promise<SubscriptionView> {
    const { defaults, profiles } = this.claude;
    const listed = await profiles.profiles();
    const accounts = await Promise.all(
      listed.map(async (profile) => ({ ...profile, ...(await profiles.account(profile.path)) })),
    );
    const choices = accounts
      .filter(({ credentials }) => credentials !== null)
      .map(({ account, label, path }) => ({ account, label, path }));
    const chosen = this.chosen
      ? accounts.find(({ path }) => path === this.chosen)
      : accounts.find(({ credentials }) => credentials === defaults.credentials);
    return {
      account: chosen?.account ?? null,
      available: this.chosen ? Boolean(chosen?.credentials) : await profiles.exists(defaults.credentials),
      choices,
      label: chosen?.label ?? null,
      profile: chosen?.path ?? null,
    };
  }
}
