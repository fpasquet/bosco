import type {
  Branches,
  Clock,
  DiscoveryToImport,
  Folders,
  GitOrigins,
  GroupRepository,
  IgnoredFolders,
  ProjectDomains,
  ProjectRepository,
  RunningSessions,
  SessionFolders,
} from './ports.ts';
import { importDiscovered } from '../domain/discovered-import.ts';
import {
  browsedFolder,
  crumbsOf,
  FolderNotFound,
  FolderPath,
  isInside,
  parentOf,
  visibleFiles,
  visibleFolders,
} from '../domain/folder.ts';
import { type ProjectPlace, ProjectPlacement } from '../domain/placement.ts';
import {
  Project,
  type ProjectChanges,
  ProjectHasRunningSession,
  type ProjectPlaceChoice,
  type ProjectSnapshot,
  UnknownProject,
} from '../domain/project.ts';
import { activityOf, type Suggestion } from '../domain/suggestions.ts';

export interface ProjectView extends ProjectSnapshot {
  lastSessionAt: Date | null;
  /** Monodépôt : ses paquets sont des sous-dossiers, ses sessions se rangent sous lui */
  monorepo: boolean;
  sessions: number;
}

/** Page d'un projet : sa vue, la branche courante de son dossier et ses sessions pilotées qui tournent. */
export interface ProjectDetail extends ProjectView {
  branch: null | string;
  running: number;
}

/** Page des projets : les projets, les sessions hors projet et les dossiers proposés. */
export interface ProjectsOverview {
  home: string;
  ignored: Suggestion[];
  outside: number;
  projects: ProjectView[];
  suggestions: Suggestion[];
}

/** Un dossier ouvert dans le navigateur, avec ses sous-dossiers. */
export interface FolderListing {
  crumbs: { name: string; path: string }[];
  /** Fichiers du dossier, leurs noms seulement, quand on choisit un fichier (celui d'un jeton longue durée) */
  files?: { name: string; path: string }[];
  folders: { added: boolean; git: boolean; name: string; path: string; suggestion: boolean }[];
  home: string;
  parent: null | string;
  path: string;
}

const NO_SESSIONS: SessionFolders = { list: () => Promise.resolve([]) };
const NO_RUNNING: RunningSessions = { countIn: () => Promise.resolve(0) };
const NO_DOMAINS: ProjectDomains = { publish: () => Promise.resolve() };

/**
 * Projets choisis par la personne : les dossiers qu'elle ajoute, où se rangent les sessions. Gardés en mémoire, car la
 * vue de chaque session en dépend ; un ajout ou un retrait vaut aussitôt.
 */
export class ProjectService {
  private projects: ProjectSnapshot[] = [];
  private placement: ProjectPlacement;
  private running: RunningSessions = NO_RUNNING;
  private domains: ProjectDomains = NO_DOMAINS;
  private sessions: SessionFolders = NO_SESSIONS;

  constructor(
    private readonly repository: ProjectRepository,
    private readonly groups: GroupRepository,
    private readonly ignoredFolders: IgnoredFolders,
    private readonly folders: Folders,
    private readonly git: GitOrigins,
    private readonly discovery: DiscoveryToImport,
    private readonly branches: Branches,
    private readonly clock: Clock,
    /** Dossier personnel, d'où part le navigateur de dossiers */
    private readonly home: string,
    /** Dossiers temporaires et de données de Bosco : jamais proposés, avec tout ce qu'ils contiennent */
    private readonly unproposed: readonly string[] = [],
  ) {
    this.placement = new ProjectPlacement([], git);
  }

  /** Sessions déjà lues, branchées au démarrage (le contexte des sessions dépend de celui-ci). */
  useSessions(sessions: SessionFolders): void {
    this.sessions = sessions;
  }

  /** Sessions pilotées qui tournent, branchées au démarrage : elles empêchent de retirer leur projet. */
  useRunning(running: RunningSessions): void {
    this.running = running;
  }

  /** Proxies de sortie des bacs à sable, branchés au démarrage : ils reçoivent aussitôt les domaines de chaque projet. */
  async useDomains(domains: ProjectDomains): Promise<void> {
    this.domains = domains;
    await this.publishDomains();
  }

  /** Projets lus au démarrage (et après une remise à zéro des scénarios), après la reprise des dépôts découverts. */
  async load(): Promise<void> {
    await this.importDiscovered();
    await this.refresh();
  }

  /** Projet d'une session ; null quand elle est hors projet. */
  placeOf(gitRoot: null | string, path: null | string): null | ProjectPlace {
    return this.placement.placeOf(gitRoot, path);
  }

  /**
   * Dossier d'une session hors projet : sa racine git (celle d'origine pour un worktree), sinon son dossier de travail ;
   * sous un dossier temporaire ou de données, ce dossier lui-même, pour ne pas compter chaque essai à part.
   */
  folderOf(gitRoot: null | string, path: null | string): null | string {
    const folder = this.placement.suggestionOf(gitRoot, path)?.path ?? null;
    return (folder && this.unproposed.find((below) => isInside(folder, below))) ?? folder;
  }

  listProjects(): ProjectSnapshot[] {
    return this.projects.map((project) => ({ ...project }));
  }

  async overview(): Promise<ProjectsOverview> {
    const [sessions, ignored] = await Promise.all([this.sessions.list(), this.ignoredFolders.list()]);
    const activity = activityOf(sessions, this.placement, new Set(ignored), this.clock.now(), {
      below: this.unproposed,
      home: this.home,
    });
    const monorepos = await Promise.all(this.projects.map((project) => this.folders.isMonorepo(project.path)));
    const projects = this.projects
      .map((project, index) => {
        const found = activity.projects.get(project.id);
        return {
          ...project,
          lastSessionAt: found?.lastSessionAt ?? null,
          monorepo: monorepos[index] ?? false,
          sessions: found?.sessions ?? 0,
        };
      })
      .toSorted(
        (a, b) =>
          (b.lastSessionAt?.getTime() ?? 0) - (a.lastSessionAt?.getTime() ?? 0) || a.name.localeCompare(b.name, 'fr'),
      );
    return {
      home: this.home,
      ignored: activity.suggestions.filter((suggestion) => suggestion.ignored),
      outside: activity.outside,
      projects,
      suggestions: activity.suggestions.filter((suggestion) => !suggestion.ignored),
    };
  }

  /** Un projet, avec l'activité de ses sessions et la branche courante de son dossier. */
  async getProject(id: number): Promise<ProjectDetail> {
    const { projects } = await this.overview();
    const project = projects.find((candidate) => candidate.id === id);
    if (!project) throw new UnknownProject(id);
    const [branch, running] = await Promise.all([
      project.git ? this.branches.currentOf(project.path) : null,
      this.running.countIn(id),
    ]);
    return { ...project, branch, running };
  }

  /** Épingle ou désépingle un projet, ou règle les valeurs par défaut de ses sessions ; vaut tout de suite. */
  async changeProject(id: number, changes: ProjectChanges): Promise<ProjectDetail> {
    const project = await this.loadProject(id);
    project.change(changes);
    await this.repository.save([project]);
    await this.refresh();
    return this.getProject(id);
  }

  /** Un domaine propre au projet, ajouté à la liste générale pour ses bacs à sable, sans les relancer. */
  async addDomain(id: number, domain: string): Promise<ProjectDetail> {
    const project = await this.loadProject(id);
    project.addDomain(domain);
    await this.repository.save([project]);
    await this.refresh();
    return this.getProject(id);
  }

  async removeDomain(id: number, domain: string): Promise<ProjectDetail> {
    const project = await this.loadProject(id);
    project.removeDomain(domain);
    await this.repository.save([project]);
    await this.refresh();
    return this.getProject(id);
  }

  /** « Où elle tourne » d'une session démarrée dans le projet : la suivante le reprend. */
  async rememberPlace(root: string, place: ProjectPlaceChoice): Promise<void> {
    const found = this.projects.find((project) => project.path === root);
    if (!found || found.place === place) return;
    const project = await this.loadProject(found.id);
    project.rememberPlace(place);
    await this.repository.save([project]);
    await this.refresh();
  }

  /** Ajoute un ou plusieurs dossiers d'un coup ; un dossier ignoré redevient proposable s'il est retiré plus tard. */
  async addProjects(paths: readonly string[]): Promise<ProjectSnapshot[]> {
    const folders = [
      ...new Map(paths.map((path) => FolderPath.of(path)).map((folder) => [folder.value, folder] as const)).values(),
    ];
    const added: Project[] = [];
    let id = await this.repository.nextId();
    for (const folder of folders) {
      const found = await this.folders.inspect(folder.value);
      if (!found) throw new FolderNotFound(folder.value);
      const project = Project.add({
        addedAt: this.clock.now(),
        folder,
        git: found.git,
        id,
        projects: [...this.projects, ...added.map((candidate) => candidate.toSnapshot())],
      });
      added.push(project);
      id += 1;
    }
    await this.repository.save(added);
    await this.ignoredFolders.restore(folders.map((folder) => folder.value));
    await this.refresh();
    return added.map((project) => project.toSnapshot());
  }

  /**
   * Retire un projet de Bosco : rien n'est touché sur le poste, ses sessions passent hors projet et il sort de ses
   * groupes, où le suivant devient principal.
   */
  async removeProject(id: number): Promise<void> {
    const project = this.projects.find((candidate) => candidate.id === id);
    if (!project) throw new UnknownProject(id);
    // Une session pilotée qui tourne travaille encore dans ce dossier : on attend qu'elle s'arrête
    const running = await this.running.countIn(id);
    if (running > 0) throw new ProjectHasRunningSession(project.name);
    const groups = await this.groups.list();
    const touched = groups.filter((group) => group.has(id));
    for (const group of touched) group.removeProject(id);
    await this.groups.save(touched);
    await this.repository.remove(id);
    await this.refresh();
  }

  async ignoreSuggestion(path: string): Promise<void> {
    const folder = FolderPath.of(path);
    await this.ignoredFolders.ignore(folder.value, this.clock.now());
  }

  async restoreSuggestion(path: string): Promise<void> {
    const folder = FolderPath.of(path);
    await this.ignoredFolders.restore([folder.value]);
  }

  /**
   * Sous-dossiers d'un dossier du dossier personnel : leurs noms seulement, dossiers cachés masqués (sauf `hidden`,
   * pour choisir un dossier de configuration de Claude Code), avec ce que la personne doit savoir pour choisir (dépôt
   * git, déjà ajouté, une session y a tourné). `files` ajoute les noms des fichiers, pour choisir un fichier (le jeton
   * longue durée d'un profil), sans jamais lire leur contenu.
   */
  async browse(path: null | string, hidden = false, files = false): Promise<FolderListing> {
    const asked = browsedFolder(path, this.home, hidden);
    const [real, realHome] = await Promise.all([this.folders.realPath(asked.value), this.folders.realPath(this.home)]);
    if (!real || !realHome) throw new FolderNotFound(asked.value);
    // Un lien symbolique ne fait pas sortir du dossier personnel
    browsedFolder(real, realHome, hidden);
    const [entries, overview] = await Promise.all([this.folders.list(asked.value), this.overview()]);
    const added = new Set(this.projects.map((project) => project.path));
    const suggested = new Set(overview.suggestions.map((suggestion) => suggestion.path));
    const child = (name: string) => (asked.value === '/' ? `/${name}` : `${asked.value}/${name}`);
    return {
      crumbs: crumbsOf(asked, this.home),
      ...(files ? { files: visibleFiles(entries, hidden).map((name) => ({ name, path: child(name) })) } : {}),
      folders: visibleFolders(entries, hidden).map(({ git, name }) => {
        const child = asked.value === '/' ? `/${name}` : `${asked.value}/${name}`;
        return { added: added.has(child), git, name, path: child, suggestion: suggested.has(child) };
      }),
      home: this.home,
      parent: parentOf(asked, this.home),
      path: asked.value,
    };
  }

  /** Une fois, au passage aux projets choisis : les dépôts découverts et affichés deviennent des projets. */
  private async importDiscovered(): Promise<void> {
    const pending = await this.discovery.pending();
    if (!pending) return;
    const [sessions, existing] = await Promise.all([this.sessions.list(), this.repository.list()]);
    const found = importDiscovered(pending, sessions, this.home, this.git);
    const projects = existing.map((project) => project.toSnapshot());
    const added: Project[] = [];
    let id = await this.repository.nextId();
    for (const { git, path } of found.projects) {
      if (projects.some((project) => project.path === path)) continue;
      const project = Project.add({ addedAt: this.clock.now(), folder: FolderPath.of(path), git, id, projects });
      added.push(project);
      projects.push(project.toSnapshot());
      id += 1;
    }
    await this.repository.save(added);
    for (const path of found.ignored) await this.ignoredFolders.ignore(path, this.clock.now());
    await this.discovery.settle();
  }

  private async loadProject(id: number): Promise<Project> {
    const projects = await this.repository.list();
    const project = projects.find((candidate) => candidate.id === id);
    if (!project) throw new UnknownProject(id);
    return project;
  }

  private async refresh(): Promise<void> {
    const projects = await this.repository.list();
    this.projects = projects.map((project) => project.toSnapshot());
    this.placement = new ProjectPlacement(this.projects, this.git);
    await this.publishDomains();
  }

  private async publishDomains(): Promise<void> {
    await this.domains.publish(this.projects.map(({ domains, path }) => ({ domains, path })));
  }
}
