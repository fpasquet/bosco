import type { ProfileAccess, SandboxAccess } from '../../shared/domain/profile-access.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import { allows, isDomain, LOCKED_DOMAINS } from '../domain/egress.ts';

/** Domaines ajoutés et abonnement par défaut, rangés dans la base de Bosco. */
export interface IsolationStore {
  addedDomains(): Promise<string[]>;
  saveAddedDomains(domains: readonly string[]): Promise<void>;
  saveSubscription(profile: null | string): Promise<void>;
  subscription(): Promise<null | string>;
}

/** Profil Claude Code surveillé : son dossier, et le fichier de son jeton longue durée s'il en a déclaré un. */
export interface ClaudeProfile {
  label: string;
  path: string;
  tokenFile: null | string;
}

/** Profils Claude Code du poste et leur accès à l'abonnement ; rien n'est jamais montré des jetons eux-mêmes. */
export interface ClaudeProfiles {
  /** Compte de l'abonnement d'un profil et son accès : sa connexion, son jeton longue durée, ou aucun */
  access(profile: ClaudeProfile): Promise<{ access: ProfileAccess; account: null | string }>;
  /** Le fichier existe sur le poste */
  exists(path: string): Promise<boolean>;
  /** Profils Claude Code surveillés */
  profiles(): Promise<ClaudeProfile[]>;
}

/** Profil qui a un accès à l'abonnement : un choix possible, avec son compte et la forme de son accès. */
export interface SubscriptionChoice {
  access: 'login' | 'token';
  account: null | string;
  label: string;
  path: string;
  /** Fichier du jeton longue durée ; null pour une connexion */
  tokenFile: null | string;
}

/** Profil surveillé sans accès utilisable : visible, grisé ; problem dit pourquoi un jeton déclaré ne sert pas. */
export interface UnavailableSubscription {
  label: string;
  path: string;
  problem: null | string;
  tokenFile: null | string;
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
  /** Forme de l'accès du profil par défaut ; null sans profil connu */
  access: 'login' | 'token' | null;
  account: null | string;
  /** Un accès à l'abonnement existe : sans lui, aucun bac à sable ne démarre */
  available: boolean;
  choices: SubscriptionChoice[];
  label: null | string;
  profile: null | string;
  unavailable: UnavailableSubscription[];
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

  /**
   * Accès à l'abonnement d'un profil pour un bac à sable ; celui par défaut sans profil. Un jeton déclaré passe tel
   * quel, même illisible : le tour dira pourquoi il ne part pas, plutôt que de prendre un autre compte.
   */
  async accessOf(profile: null | string = null): Promise<SandboxAccess> {
    const chosen = profile ?? this.chosen;
    if (chosen) {
      const listed = await this.claude.profiles.profiles();
      const known = listed.find(({ path }) => path === chosen) ?? { label: '', path: chosen, tokenFile: null };
      const { access } = await this.claude.profiles.access(known);
      if (access.kind === 'login') return { kind: 'login', credentials: access.credentials };
      if (access.kind === 'token') return { kind: 'token', tokenFile: access.tokenFile };
      if (access.tokenFile) return { kind: 'token', tokenFile: access.tokenFile };
    }
    return { kind: 'login', credentials: this.claude.defaults.credentials };
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
      const known = profiles.find(({ path }) => path === profile);
      const found = known ? await this.claude.profiles.access(known) : null;
      if (!found || found.access.kind === 'none')
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
      listed.map(async (profile) => ({ ...profile, ...(await profiles.access(profile)) })),
    );
    const choices: SubscriptionChoice[] = accounts.flatMap(({ access, account, label, path }) =>
      access.kind === 'none'
        ? []
        : [{ access: access.kind, account, label, path, tokenFile: access.kind === 'token' ? access.tokenFile : null }],
    );
    const unavailable: UnavailableSubscription[] = accounts.flatMap(({ access, label, path }) =>
      access.kind === 'none' ? [{ label, path, problem: access.problem, tokenFile: access.tokenFile }] : [],
    );
    const chosen = this.chosen
      ? accounts.find(({ path }) => path === this.chosen)
      : accounts.find(({ access }) => access.kind === 'login' && access.credentials === defaults.credentials);
    const usable = chosen && chosen.access.kind !== 'none' ? chosen.access.kind : null;
    return {
      access: usable,
      account: chosen?.account ?? null,
      available: this.chosen ? usable !== null : await profiles.exists(defaults.credentials),
      choices,
      label: chosen?.label ?? null,
      profile: chosen?.path ?? null,
      unavailable,
    };
  }
}
