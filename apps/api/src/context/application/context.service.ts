import { DomainError } from '../../shared/domain/domain-error.ts';
import {
  type Architecture,
  type ContextLink,
  contextOf,
  contextText,
  type RepositoryContext,
  tokensOf,
} from '../domain/context-text.ts';
import { Decision, type DecisionSnapshot, type DecisionTarget, type DecisionText } from '../domain/decision.ts';
import { checkInheritance, type SocleScope, type SocleSnapshot, soclesOf } from '../domain/socle.ts';

export interface DecisionRepository {
  list(): Promise<Decision[]>;
  nextId(): Promise<number>;
  save(decisions: readonly Decision[]): Promise<void>;
}

export interface SocleRepository {
  list(): Promise<SocleSnapshot[]>;
  nextId(): Promise<number>;
  save(socle: SocleSnapshot): Promise<void>;
}

export interface ArchitectureStore {
  of(repository: string): Promise<Architecture>;
  save(repository: string, architecture: Architecture): Promise<void>;
}

/** Dépôts connus du poste, d'après les sessions des profils surveillés. */
export interface KnownRepositories {
  list(): Promise<{ name: string; root: string }[]>;
}

export class UnknownDecision extends DomainError {
  constructor(id: number) {
    super('unknownDecision', `No decision DEC-${id}`);
  }
}

export interface ContextOverview extends RepositoryContext {
  repository: string;
}

export interface ContextPreview {
  /** Ce qui n'est pas transmis, pour ne pas croire à un oubli (E9f, annotation 2) */
  absent: { excluded: DecisionSnapshot[]; proposed: DecisionSnapshot[] };
  at: Date;
  text: string;
  tokens: number;
}

export interface SocleView extends SocleSnapshot {
  /** Dépôts auxquels il s'applique vraiment : tous pour un socle global */
  applied: string[];
  decisions: DecisionSnapshot[];
  /** Exceptions locales : une décision d'un dépôt qui retire celle du socle (CA-CONT-57) */
  exceptions: { decision: DecisionSnapshot; repository: string; replaces: DecisionSnapshot }[];
}

/**
 * Contexte transmis aux agents (RF-CONT-01 à 03, 10, 11) : décisions des dépôts et des socles, versionnées, proposées
 * par un agent et validées par toi seul, et place de chaque dépôt dans l'architecture.
 */
export class ContextService {
  constructor(
    private readonly decisions: DecisionRepository,
    private readonly socles: SocleRepository,
    private readonly architectures: ArchitectureStore,
    private readonly repositories: KnownRepositories,
    private readonly clock: { now(): Date },
  ) {}

  async overview(repository: string): Promise<ContextOverview> {
    const context = await this.contextOf(repository);
    return { repository, ...context };
  }

  /** Texte exact qu'un agent lira au prochain lancement, avec les liens d'une tâche s'il y en a (E9f). */
  async preview(repository: string, links: readonly ContextLink[] = []): Promise<ContextPreview> {
    const context = await this.contextOf(repository);
    const text = contextText(repository, context, links);
    return {
      text,
      tokens: tokensOf(text),
      at: this.clock.now(),
      absent: { proposed: context.proposed, excluded: context.excluded },
    };
  }

  /** Décisions transmises à un lancement, avec leur version : gardées dans le journal de la tâche (CA-CONT-23). */
  async sentTo(repository: string, links: readonly ContextLink[] = []): Promise<{ text: string; versions: string }> {
    const context = await this.contextOf(repository);
    const sent = [...context.decisions, ...context.socles.flatMap(({ decisions }) => decisions)];
    return {
      text: contextText(repository, context, links),
      versions: sent.map((decision) => `DEC-${decision.id} v${decision.versions.length}`).join(', '),
    };
  }

  /** Dépôts qui ont une décision à eux, proposée ou acceptée : ceux que l'écran du contexte propose de consulter. */
  async listDecidedRepositories(): Promise<string[]> {
    const all = await this.decisions.list();
    const names = all.flatMap((decision) => {
      const { state, target } = decision.toSnapshot();
      return target.kind === 'repository' && (state === 'accepted' || state === 'proposed') ? [target.name] : [];
    });
    return [...new Set(names)].toSorted((a, b) => a.localeCompare(b));
  }

  async proposals(): Promise<DecisionSnapshot[]> {
    const all = await this.decisions.list();
    return all.map((decision) => decision.toSnapshot()).filter((decision) => decision.state === 'proposed');
  }

  async decision(
    id: number,
  ): Promise<{ decision: DecisionSnapshot; replacedBy: DecisionSnapshot | null; specifiedBy: DecisionSnapshot[] }> {
    const all = await this.decisions.list();
    const decision = this.find(all, id).toSnapshot();
    const snapshots = all.map((candidate) => candidate.toSnapshot());
    return {
      decision,
      replacedBy: snapshots.find((candidate) => candidate.id === decision.replacedBy) ?? null,
      specifiedBy: snapshots.filter((candidate) => candidate.specifies.includes(id)),
    };
  }

  /** Nouvelle décision, écrite par toi ; elle peut en remplacer une autre (CA-CONT-16). */
  async write(
    target: DecisionTarget,
    text: DecisionText,
    options: { accept: boolean; exceptionTo: null | number; replaces: null | number },
  ): Promise<DecisionSnapshot> {
    const all = await this.decisions.list();
    const id = await this.decisions.nextId();
    const decision = Decision.write(id, target, text, { ...options, at: this.clock.now() });
    const touched = [decision];
    if (options.replaces !== null) {
      const replaced = this.find(all, options.replaces);
      replaced.replace(decision.id);
      touched.push(replaced);
    }
    await this.decisions.save(touched);
    return decision.toSnapshot();
  }

  /** Proposée par un agent ou une session : elle attend ta validation (RF-CONT-02). */
  async propose(repository: string, text: DecisionText, taskId: null | number): Promise<DecisionSnapshot> {
    const id = await this.decisions.nextId();
    const decision = Decision.propose(id, repository, text, taskId, this.clock.now());
    await this.decisions.save([decision]);
    return decision.toSnapshot();
  }

  accept(id: number, edited: DecisionText | null): Promise<DecisionSnapshot> {
    return this.change(id, (decision) => decision.accept(this.clock.now(), edited));
  }

  refuse(id: number, reason: null | string): Promise<DecisionSnapshot> {
    return this.change(id, (decision) => decision.refuse(reason));
  }

  edit(id: number, text: DecisionText, note: string): Promise<DecisionSnapshot> {
    return this.change(id, (decision) => decision.edit(text, note, this.clock.now()));
  }

  abandon(id: number, reason: null | string): Promise<DecisionSnapshot> {
    return this.change(id, (decision) => decision.abandon(reason));
  }

  async setArchitecture(repository: string, architecture: Architecture): Promise<Architecture> {
    const clean = (list: string[]) => [...new Set(list.map((name) => name.trim()).filter(Boolean))];
    const next = { calls: clean(architecture.calls), calledBy: clean(architecture.calledBy) };
    await this.architectures.save(repository, next);
    return next;
  }

  async listSocles(): Promise<SocleView[]> {
    const [socles, decisions, known] = await Promise.all([
      this.socles.list(),
      this.decisions.list(),
      this.repositories.list(),
    ]);
    const snapshots = decisions.map((decision) => decision.toSnapshot());
    return socles.map((socle) => {
      const own = snapshots.filter(
        (decision) =>
          decision.target.kind === 'socle' && decision.target.id === socle.id && decision.state === 'accepted',
      );
      const applied = known
        .map(({ name }) => name)
        .filter((name) => soclesOf(name, socles).some(({ id }) => id === socle.id));
      const exceptions = snapshots.flatMap((decision) => {
        const replaces = own.find((candidate) => candidate.id === decision.exceptionTo);
        return replaces && decision.state === 'accepted' && decision.target.kind === 'repository'
          ? [{ decision, replaces, repository: decision.target.name }]
          : [];
      });
      return { ...socle, applied, decisions: own, exceptions };
    });
  }

  /** Nouveau socle, ou socle changé : son héritage ne boucle jamais (E14b). */
  async saveSocle(socle: Omit<SocleSnapshot, 'id'> & { id: null | number }): Promise<SocleSnapshot> {
    const socles = await this.socles.list();
    if (!socle.name.trim()) throw new DomainError('socleName', 'Donne un nom au socle.');
    const id = socle.id ?? (await this.socles.nextId());
    checkInheritance(id, socle.inherits, socles);
    const saved: SocleSnapshot = {
      id,
      name: socle.name.trim(),
      scope: socle.scope satisfies SocleScope,
      inherits: socle.inherits,
      repositories: socle.scope === 'global' ? [] : [...new Set(socle.repositories)],
    };
    await this.socles.save(saved);
    return saved;
  }

  private async contextOf(repository: string): Promise<RepositoryContext> {
    const [decisions, socles, architecture] = await Promise.all([
      this.decisions.list(),
      this.socles.list(),
      this.architectures.of(repository),
    ]);
    return contextOf(
      repository,
      decisions.map((decision) => decision.toSnapshot()),
      socles,
      architecture,
    );
  }

  private async change(id: number, apply: (decision: Decision) => void): Promise<DecisionSnapshot> {
    const all = await this.decisions.list();
    const decision = this.find(all, id);
    apply(decision);
    await this.decisions.save([decision]);
    return decision.toSnapshot();
  }

  private find(decisions: readonly Decision[], id: number): Decision {
    const decision = decisions.find((candidate) => candidate.id === id);
    if (!decision) throw new UnknownDecision(id);
    return decision;
  }
}
