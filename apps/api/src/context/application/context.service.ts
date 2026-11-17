import { DomainError } from '../../shared/domain/domain-error.ts';
import { type Architecture, contextOf, contextText, type ProjectContext, tokensOf } from '../domain/context-text.ts';
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
  of(project: string): Promise<Architecture>;
  save(project: string, architecture: Architecture): Promise<void>;
}

/** Projets connus du poste, d'après les sessions des profils surveillés. */
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
  /** Ce qui n'est pas transmis, pour ne pas croire à un oubli (E9f, annotation 2) */
  absent: { excluded: DecisionSnapshot[]; proposed: DecisionSnapshot[] };
  at: Date;
  text: string;
  tokens: number;
}

export interface SocleView extends SocleSnapshot {
  /** Projets auxquels il s'applique vraiment : tous pour un socle global */
  applied: string[];
  decisions: DecisionSnapshot[];
  /** Exceptions locales : une décision d'un projet qui retire celle du socle (CA-CONT-57) */
  exceptions: { decision: DecisionSnapshot; project: string; replaces: DecisionSnapshot }[];
}

/**
 * Contexte transmis aux agents (RF-CONT-01 à 03, 10, 11) : décisions des projets et des socles, versionnées, proposées
 * par un agent et validées par toi seul, et place de chaque projet dans l'architecture.
 */
export class ContextService {
  constructor(
    private readonly decisions: DecisionRepository,
    private readonly socles: SocleRepository,
    private readonly architectures: ArchitectureStore,
    private readonly projects: KnownProjects,
    private readonly clock: { now(): Date },
  ) {}

  listProjects(): Promise<{ name: string; root: string }[]> {
    return this.projects.list();
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

  /** Texte exact qu'une session lira par le serveur MCP de Bosco (E9f). */
  async preview(project: string): Promise<ContextPreview> {
    const context = await this.contextOf(project);
    const text = contextText(project, context);
    return {
      text,
      tokens: tokensOf(text),
      at: this.clock.now(),
      absent: { proposed: context.proposed, excluded: context.excluded },
    };
  }

  /** Projets qui ont une décision à eux, proposée ou acceptée : ceux que l'écran du contexte propose de consulter. */
  async listDecidedProjects(): Promise<string[]> {
    const all = await this.decisions.list();
    const names = all.flatMap((decision) => {
      const { state, target } = decision.toSnapshot();
      return target.kind === 'project' && (state === 'accepted' || state === 'proposed') ? [target.name] : [];
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
  async propose(project: string, text: DecisionText, taskId: null | number): Promise<DecisionSnapshot> {
    const id = await this.decisions.nextId();
    const decision = Decision.propose(id, project, text, taskId, this.clock.now());
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

  async setArchitecture(project: string, architecture: Architecture): Promise<Architecture> {
    const clean = (list: string[]) => [...new Set(list.map((name) => name.trim()).filter(Boolean))];
    const next = { calls: clean(architecture.calls), calledBy: clean(architecture.calledBy) };
    await this.architectures.save(project, next);
    return next;
  }

  async listSocles(): Promise<SocleView[]> {
    const [socles, decisions, known] = await Promise.all([
      this.socles.list(),
      this.decisions.list(),
      this.projects.list(),
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
        return replaces && decision.state === 'accepted' && decision.target.kind === 'project'
          ? [{ decision, replaces, project: decision.target.name }]
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
      projects: socle.scope === 'global' ? [] : [...new Set(socle.projects)],
    };
    await this.socles.save(saved);
    return saved;
  }

  private async contextOf(project: string): Promise<ProjectContext> {
    const [decisions, socles, architecture] = await Promise.all([
      this.decisions.list(),
      this.socles.list(),
      this.architectures.of(project),
    ]);
    return contextOf(
      project,
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
