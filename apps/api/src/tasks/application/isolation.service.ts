import { DomainError } from '../../shared/domain/domain-error.ts';
import { allows, type EgressRefusal, isDomain, LOCKED_DOMAINS } from '../domain/egress.ts';
import { npmRegistries, type NpmRegistry } from '../domain/npmrc.ts';

/** Domaines ajoutés, plafond d'agents et refus, rangés dans la base de Bosco. */
export interface IsolationStore {
  addedDomains(): Promise<string[]>;
  maxAgents(): Promise<null | number>;
  record(refusal: EgressRefusal): Promise<void>;
  refusals(limit: number): Promise<EgressRefusal[]>;
  saveAddedDomains(domains: readonly string[]): Promise<void>;
  saveMaxAgents(agents: number): Promise<void>;
  saveSecrets(choice: SecretsChoice): Promise<void>;
  secrets(): Promise<SecretsChoice>;
}

/** Ce que chaque tâche reçoit (E11b) : l'accès Claude du profil choisi, et le .npmrc choisi s'il existe. */
export interface SecretsChoice {
  /** Fichier .npmrc écrit comme dans le terminal (« ~/.npmrc ») ; null : celui par défaut */
  npmrc: null | string;
  /** Profil Claude Code dont le worker prend l'abonnement ; null : l'accès de la configuration */
  profile: null | string;
}

/** Ce que le poste dit des profils et du .npmrc ; rien n'est jamais montré des jetons eux-mêmes. */
export interface WorkerSecretsReader {
  /** Compte de l'abonnement d'un profil et son fichier d'accès, s'il en a un */
  account(profile: string): Promise<{ account: null | string; credentials: null | string }>;
  /** Le fichier existe sur le poste */
  exists(path: string): Promise<boolean>;
  /** Contenu d'un .npmrc, ou null s'il n'existe pas */
  npmrc(path: string): Promise<null | string>;
  /** Profils Claude Code surveillés */
  profiles(): Promise<{ label: string; path: string }[]>;
}

export interface SecretsDefaults {
  /** Accès Claude de la configuration (BOSCO_WORKER_CREDENTIALS, DT-09) */
  credentials: string;
  /** Dossier personnel, pour lire « ~ » */
  home: string;
  npmrc: string;
}

/** Secrets vus dans les réglages (E11b) : profil choisi et son compte, .npmrc et ses registres. */
export interface SecretsView {
  claude: {
    account: null | string;
    /** Un accès à l'abonnement existe : sans lui, le worker ne lance aucun agent */
    available: boolean;
    choices: { account: null | string; label: string; path: string }[];
    label: null | string;
    profile: null | string;
  };
  npmrc: { exists: boolean; path: string; registries: NpmRegistry[] };
}

const NO_SECRETS: { defaults: SecretsDefaults; reader: WorkerSecretsReader } = {
  defaults: { credentials: '', home: '', npmrc: '' },
  reader: {
    account: () => Promise.resolve({ account: null, credentials: null }),
    exists: () => Promise.resolve(false),
    npmrc: () => Promise.resolve(null),
    profiles: () => Promise.resolve([]),
  },
};

/** Liste lue par le proxy de chaque tâche à chaque connexion : un changement vaut tout de suite. */
export interface AllowListPublisher {
  publish(domains: readonly string[]): Promise<void>;
}

/** Réglage refusé ; son message s'affiche tel quel sous le champ. */
export class InvalidIsolation extends DomainError {
  constructor(message: string) {
    super('invalid_isolation', message);
  }
}

/** Plafond d'agents du worker (E11a) : réglable de 1 à 8, 4 par défaut. */
export const AGENTS = { default: 4, max: 8, min: 1 } as const;

const RECENT_REFUSALS = 20;

export interface IsolationSnapshot {
  added: string[];
  locked: string[];
  maxAgents: number;
  refusals: EgressRefusal[];
  /** Domaines des registres du .npmrc, autorisés d'office pour que les installations passent */
  registries: string[];
  secrets: SecretsView;
}

/** Chemin écrit comme dans le terminal : « ~ » devient le dossier personnel. */
function expandHome(path: string, home: string): string {
  return path === '~' || path.startsWith('~/') ? `${home}${path.slice(1)}` : path;
}

/** Réglages de l'isolation du worker (E11a, E11b) : plafond d'agents, domaines autorisés, refus récents. */
export class IsolationService {
  private added: string[] = [];
  private agents: number = AGENTS.default;
  private choice: SecretsChoice = { npmrc: null, profile: null };
  private registries: NpmRegistry[] = [];

  constructor(
    private readonly store: IsolationStore,
    private readonly publisher: AllowListPublisher,
    private readonly secrets: { defaults: SecretsDefaults; reader: WorkerSecretsReader } = NO_SECRETS,
  ) {}

  async load(): Promise<void> {
    this.added = await this.store.addedDomains();
    this.agents = (await this.store.maxAgents()) ?? AGENTS.default;
    this.choice = await this.store.secrets();
    await this.readRegistries();
    await this.publish();
  }

  /**
   * Secrets d'une tâche qui démarre (E11b) : l'accès Claude du profil choisi, et le .npmrc choisi s'il existe, relu
   * à chaque tâche pour que ses registres restent autorisés.
   */
  async workerSecrets(): Promise<{ credentials: string; npmrc: null | string }> {
    const npmrc = await this.refreshRegistries();
    const chosen = this.choice.profile ? await this.secrets.reader.account(this.choice.profile) : null;
    return { credentials: chosen?.credentials ?? this.secrets.defaults.credentials, npmrc };
  }

  /** Profil de l'abonnement et .npmrc (E11b) ; valent pour les tâches suivantes. */
  async setSecrets(changes: Partial<SecretsChoice>): Promise<IsolationSnapshot> {
    const next = { ...this.choice, ...changes };
    if (changes.profile) {
      const profiles = await this.secrets.reader.profiles();
      const known = profiles.some(({ path }) => path === changes.profile);
      const { credentials } = await this.secrets.reader.account(changes.profile);
      if (!known || !credentials)
        throw new InvalidIsolation('Ce profil n’a pas d’accès à l’abonnement Claude : connecte-toi dans ce profil.');
    }
    if (changes.npmrc) {
      const path = changes.npmrc.trim();
      if (path !== '~' && !path.startsWith('/') && !path.startsWith('~/'))
        throw new InvalidIsolation('Écris le chemin du fichier comme dans le terminal : ~/.npmrc.');
      next.npmrc = path;
    }
    this.choice = next;
    await this.store.saveSecrets(next);
    await this.readRegistries();
    await this.publish();
    return this.snapshot();
  }

  maxAgents(): number {
    return this.agents;
  }

  allowList(): string[] {
    const listed = [...LOCKED_DOMAINS, ...this.added];
    return [...listed, ...this.registryHosts().filter((host) => !listed.includes(host))];
  }

  /** Les refus d'un domaine depuis autorisé ne sont plus montrés : l'agent peut réessayer. */
  async snapshot(): Promise<IsolationSnapshot> {
    // Le .npmrc a pu changer sur le poste : ses registres restent autorisés et affichés à jour
    await this.refreshRegistries();
    const refusals = await this.store.refusals(RECENT_REFUSALS);
    return {
      locked: [...LOCKED_DOMAINS],
      added: [...this.added],
      maxAgents: this.agents,
      refusals: refusals.filter((refusal) => !allows(this.allowList(), refusal.host)),
      registries: this.registryHosts(),
      secrets: await this.secretsView(),
    };
  }

  /** Un nom de domaine, ou « *. » et un nom ; ajouté sans relancer les tâches en cours (RF-CONT-07). */
  async addDomain(value: string): Promise<IsolationSnapshot> {
    const domain = value.trim().toLowerCase();
    if (!isDomain(domain))
      throw new InvalidIsolation('Un nom de domaine seul, sans protocole ni chemin : pypi.org ou *.github.com.');
    if (this.allowList().includes(domain)) throw new InvalidIsolation(`${domain} est déjà dans la liste.`);
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

  async setMaxAgents(agents: number): Promise<IsolationSnapshot> {
    if (!Number.isInteger(agents) || agents < AGENTS.min || agents > AGENTS.max)
      throw new InvalidIsolation(`Entre ${AGENTS.min} et ${AGENTS.max} agents en même temps.`);
    this.agents = agents;
    await this.store.saveMaxAgents(agents);
    return this.snapshot();
  }

  async refused(refusal: EgressRefusal): Promise<void> {
    await this.store.record(refusal);
  }

  private async publish(): Promise<void> {
    await this.publisher.publish(this.allowList());
  }

  private npmrcPath(): string {
    return expandHome(this.choice.npmrc ?? this.secrets.defaults.npmrc, this.secrets.defaults.home);
  }

  /** Relit les registres du .npmrc et republie la liste s'ils ont changé ; rend son chemin s'il existe. */
  private async refreshRegistries(): Promise<null | string> {
    const before = this.registryHosts().join(',');
    const npmrc = await this.readRegistries();
    if (this.registryHosts().join(',') !== before) await this.publish();
    return npmrc;
  }

  /** Relit les registres du .npmrc choisi ; rend son chemin s'il existe. */
  private async readRegistries(): Promise<null | string> {
    const path = this.npmrcPath();
    const text = await this.secrets.reader.npmrc(path);
    this.registries = text === null ? [] : npmRegistries(text);
    return text === null ? null : path;
  }

  private registryHosts(): string[] {
    return [...new Set(this.registries.map(({ host }) => host))];
  }

  private async secretsView(): Promise<SecretsView> {
    const { defaults, reader } = this.secrets;
    const profiles = await reader.profiles();
    const accounts = await Promise.all(
      profiles.map(async (profile) => ({ ...profile, ...(await reader.account(profile.path)) })),
    );
    const choices = accounts
      .filter(({ credentials }) => credentials !== null)
      .map(({ account, label, path }) => ({ account, label, path }));
    const chosen = this.choice.profile
      ? accounts.find(({ path }) => path === this.choice.profile)
      : accounts.find(({ credentials }) => credentials === defaults.credentials);
    const npmrc = this.npmrcPath();
    return {
      claude: {
        account: chosen?.account ?? null,
        available: this.choice.profile ? Boolean(chosen?.credentials) : await reader.exists(defaults.credentials),
        choices,
        label: chosen?.label ?? null,
        profile: chosen?.path ?? null,
      },
      npmrc: {
        exists: await reader.exists(npmrc),
        path:
          this.choice.npmrc ??
          (npmrc.startsWith(`${defaults.home}/`) ? `~${npmrc.slice(defaults.home.length)}` : npmrc),
        registries: [...this.registries],
      },
    };
  }
}
