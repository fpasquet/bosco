import { DomainError } from '../../shared/domain/domain-error.ts';
import {
  type Architecture,
  contextOf,
  contextText,
  type GroupInstructions,
  type ProjectContext,
  sessionContextText,
  tokensOf,
} from '../domain/context-text.ts';
import {
  Decision,
  type DecisionSnapshot,
  type DecisionTarget,
  type DecisionText,
  type ProposingSession,
} from '../domain/decision.ts';

export interface DecisionRepository {
  list(): Promise<Decision[]>;
  nextId(): Promise<number>;
  save(decisions: readonly Decision[]): Promise<void>;
}

/** Groupes des projets, branchés par le point de composition. */
export interface ProjectGroups {
  /** Instructions de « Tous les projets », puis de chacun des groupes du projet */
  instructionsOf(project: string): Promise<GroupInstructions[]>;
}

export interface ArchitectureStore {
  of(project: string): Promise<Architecture>;
  save(project: string, architecture: Architecture): Promise<void>;
}

/** Sessions lues par Bosco : celle qui travaille dans un dossier, pour nommer l'auteur d'une proposition. */
export interface WorkingSessions {
  /** Session la plus récemment active dans ce dossier ; null s'il n'y en a pas */
  latestIn(path: string): Promise<null | ProposingSession>;
}

/** Proposition arrivée : la notification la signale, avec sa session. */
export interface ProposalAlerts {
  proposed(decision: DecisionSnapshot): Promise<void>;
  /** Acceptée ou refusée : sa notification est traitée */
  settled(decision: DecisionSnapshot, note: string): Promise<void>;
}

/** Projets ajoutés par la personne. */
export interface KnownProjects {
  list(): Promise<{ name: string; root: string }[]>;
}

export class UnknownDecision extends DomainError {
  constructor(id: number) {
    super('unknownDecision', `No decision DEC-${id}`);
  }
}

export interface ContextOverview extends ProjectContext {
  project: string;
}

export interface ContextPreview {
  /** Ce qui n'est pas transmis, pour ne pas croire à un oubli */
  absent: { proposed: DecisionSnapshot[] };
  at: Date;
  text: string;
  tokens: number;
}

/**
 * Contexte transmis aux agents : instructions des groupes du projet, puis ses décisions,
 * versionnées, proposées par un agent et validées par toi seul, qui l'emportent, et sa place dans l'architecture.
 */
export class ContextService {
  constructor(
    private readonly decisions: DecisionRepository,
    private readonly groups: ProjectGroups,
    private readonly architectures: ArchitectureStore,
    private readonly projects: KnownProjects,
    private readonly clock: { now(): Date },
    private readonly sessions: WorkingSessions = { latestIn: () => Promise.resolve(null) },
  ) {}

  private alerts: null | ProposalAlerts = null;

  /** Notifications des propositions, branchées par le point de composition. */
  useAlerts(alerts: ProposalAlerts): void {
    this.alerts = alerts;
  }

  /** Projet d'un dossier de travail (le plus profond qui le contient) et son dossier relatif ; null hors des projets. */
  async projectOf(path: string): Promise<null | { folder: string; name: string }> {
    const known = await this.projects.list();
    const found = known
      .filter(({ root }) => path === root || path.startsWith(`${root}/`))
      .toSorted((a, b) => b.root.length - a.root.length)[0];
    return found ? { name: found.name, folder: path.slice(found.root.length + 1) } : null;
  }

  async overview(project: string): Promise<ContextOverview> {
    const context = await this.contextOf(project);
    return { project, ...context };
  }

  /** Texte exact qu'une session lira par le serveur MCP de Bosco. */
  async preview(project: string): Promise<ContextPreview> {
    const context = await this.contextOf(project);
    const text = contextText(project, context);
    return {
      text,
      tokens: tokensOf(text),
      at: this.clock.now(),
      absent: { proposed: context.proposed },
    };
  }

  /**
   * Texte qu'une session lit par le serveur MCP de Bosco : le contexte de son projet principal, celui de son dossier de
   * travail, puis de chacun des autres projets qu'elle voit (--add-dir), une fois chacun ; null hors des
   * projets connus.
   */
  async sessionContext(path: string, others: readonly string[]): Promise<null | string> {
    const principal = await this.projectOf(path);
    if (!principal) return null;
    const names = [principal.name];
    for (const other of others) {
      const found = await this.projectOf(other);
      if (found && !names.includes(found.name)) names.push(found.name);
    }
    const blocks = [];
    for (const project of names) {
      const context = await this.contextOf(project);
      blocks.push({ project, text: contextText(project, context) });
    }
    return sessionContextText(blocks);
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

  /** Nouvelle décision, écrite par toi ; elle peut en remplacer une autre. */
  async write(
    target: DecisionTarget,
    text: DecisionText,
    options: { accept: boolean; replaces: null | number },
  ): Promise<DecisionSnapshot> {
    const all = await this.decisions.list();
    const id = await this.decisions.nextId();
    const decision = Decision.write(id, target, text, { accept: options.accept, at: this.clock.now() });
    const touched = [decision];
    if (options.replaces !== null) {
      const replaced = this.find(all, options.replaces);
      replaced.replace(decision.id);
      touched.push(replaced);
    }
    await this.decisions.save(touched);
    return decision.toSnapshot();
  }

  /**
   * Proposée par l'agent de la session qui travaille dans ce dossier : elle attend ta validation, et arrive en
   * notification.
   */
  async propose(project: string, text: DecisionText, path: string): Promise<DecisionSnapshot> {
    const [id, session] = await Promise.all([this.decisions.nextId(), this.sessions.latestIn(path)]);
    const decision = Decision.propose(id, project, text, session, this.clock.now());
    await this.decisions.save([decision]);
    const snapshot = decision.toSnapshot();
    await this.alerts?.proposed(snapshot).catch(() => undefined);
    return snapshot;
  }

  async accept(id: number, edited: DecisionText | null): Promise<DecisionSnapshot> {
    const decision = await this.change(id, (found) => found.accept(this.clock.now(), edited));
    await this.alerts?.settled(decision, 'Acceptée').catch(() => undefined);
    return decision;
  }

  async refuse(id: number, reason: null | string): Promise<DecisionSnapshot> {
    const decision = await this.change(id, (found) => found.refuse(reason));
    await this.alerts?.settled(decision, 'Refusée').catch(() => undefined);
    return decision;
  }

  edit(id: number, text: DecisionText, note: string): Promise<DecisionSnapshot> {
    return this.change(id, (decision) => decision.edit(text, note, this.clock.now()));
  }

  abandon(id: number, reason: null | string): Promise<DecisionSnapshot> {
    return this.change(id, (decision) => decision.abandon(reason));
  }

  async setArchitecture(project: string, architecture: Architecture): Promise<Architecture> {
    const clean = (list: string[]) => [...new Set(list.map((name) => name.trim()).filter(Boolean))];
    const next = { calls: clean(architecture.calls), calledBy: clean(architecture.calledBy) };
    await this.architectures.save(project, next);
    return next;
  }

  private async contextOf(project: string): Promise<ProjectContext> {
    const [decisions, groups, architecture] = await Promise.all([
      this.decisions.list(),
      this.groups.instructionsOf(project),
      this.architectures.of(project),
    ]);
    return contextOf(
      project,
      decisions.map((decision) => decision.toSnapshot()),
      groups,
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
