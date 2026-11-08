import { DomainError } from '../../shared/domain/domain-error.ts';
import { allows, type EgressRefusal, isDomain, LOCKED_DOMAINS } from '../domain/egress.ts';

/** Domaines ajoutés, plafond d'agents et refus, rangés dans la base de Bosco. */
export interface IsolationStore {
  addedDomains(): Promise<string[]>;
  maxAgents(): Promise<null | number>;
  record(refusal: EgressRefusal): Promise<void>;
  refusals(limit: number): Promise<EgressRefusal[]>;
  saveAddedDomains(domains: readonly string[]): Promise<void>;
  saveMaxAgents(agents: number): Promise<void>;
}

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
}

/** Réglages de l'isolation du worker (E11a, E11b) : plafond d'agents, domaines autorisés, refus récents. */
export class IsolationService {
  private added: string[] = [];
  private agents: number = AGENTS.default;

  constructor(
    private readonly store: IsolationStore,
    private readonly publisher: AllowListPublisher,
  ) {}

  async load(): Promise<void> {
    this.added = await this.store.addedDomains();
    this.agents = (await this.store.maxAgents()) ?? AGENTS.default;
    await this.publish();
  }

  maxAgents(): number {
    return this.agents;
  }

  allowList(): string[] {
    return [...LOCKED_DOMAINS, ...this.added];
  }

  /** Les refus d'un domaine depuis autorisé ne sont plus montrés : l'agent peut réessayer. */
  async snapshot(): Promise<IsolationSnapshot> {
    const refusals = await this.store.refusals(RECENT_REFUSALS);
    return {
      locked: [...LOCKED_DOMAINS],
      added: [...this.added],
      maxAgents: this.agents,
      refusals: refusals.filter((refusal) => !allows(this.allowList(), refusal.host)),
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
}
