import type {
  Clock,
  DiscoveryToImport,
  Folders,
  GitOrigins,
  GroupRepository,
  IgnoredFolders,
  ProjectRepository,
  SessionFolders,
} from './ports.ts';
import { importDiscovered } from '../domain/discovered-import.ts';
import { browsedFolder, crumbsOf, FolderNotFound, FolderPath, parentOf, visibleFolders } from '../domain/folder.ts';
import { type ProjectPlace, ProjectPlacement } from '../domain/placement.ts';
import { Project, type ProjectSnapshot, UnknownProject } from '../domain/project.ts';
import { activityOf, type Suggestion } from '../domain/suggestions.ts';

export interface ProjectView extends ProjectSnapshot {
  lastSessionAt: Date | null;
  sessions: number;
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
  folders: { added: boolean; git: boolean; name: string; path: string; suggestion: boolean }[];
  home: string;
  parent: null | string;
  path: string;
}

const NO_SESSIONS: SessionFolders = { list: () => Promise.resolve([]) };

/**
 * Projets choisis par la personne : les dossiers qu'elle ajoute, où se rangent les sessions. Gardés en mémoire, car la
 * vue de chaque session en dépend ; un ajout ou un retrait vaut aussitôt.
 */
export class ProjectService {
  private projects: ProjectSnapshot[] = [];
  private placement: ProjectPlacement;
  private sessions: SessionFolders = NO_SESSIONS;

  constructor(
    private readonly repository: ProjectRepository,
    private readonly groups: GroupRepository,
    private readonly ignoredFolders: IgnoredFolders,
    private readonly folders: Folders,
    private readonly git: GitOrigins,
    private readonly discovery: DiscoveryToImport,
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

  /** Projets lus au démarrage (et après une remise à zéro des scénarios), après la reprise des dépôts découverts. */
  async load(): Promise<void> {
    await this.importDiscovered();
    await this.refresh();
  }

  /** Projet d'une session ; null quand elle est hors projet. */
  placeOf(gitRoot: null | string, path: null | string): null | ProjectPlace {
    return this.placement.placeOf(gitRoot, path);
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
    const projects = this.projects
      .map((project) => {
        const found = activity.projects.get(project.id);
        return { ...project, lastSessionAt: found?.lastSessionAt ?? null, sessions: found?.sessions ?? 0 };
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
    if (!this.projects.some((project) => project.id === id)) throw new UnknownProject(id);
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
   * Sous-dossiers d'un dossier du dossier personnel : leurs noms seulement, dossiers cachés masqués, avec ce que la
   * personne doit savoir pour choisir (dépôt git, déjà ajouté, une session y a tourné).
   */
  async browse(path: null | string): Promise<FolderListing> {
    const asked = browsedFolder(path, this.home);
    const [real, realHome] = await Promise.all([this.folders.realPath(asked.value), this.folders.realPath(this.home)]);
    if (!real || !realHome) throw new FolderNotFound(asked.value);
    // Un lien symbolique ne fait pas sortir du dossier personnel
    browsedFolder(real, realHome);
    const [entries, overview] = await Promise.all([this.folders.list(asked.value), this.overview()]);
    const added = new Set(this.projects.map((project) => project.path));
    const suggested = new Set(overview.suggestions.map((suggestion) => suggestion.path));
    return {
      crumbs: crumbsOf(asked, this.home),
      folders: visibleFolders(entries).map(({ git, name }) => {
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

  private async refresh(): Promise<void> {
    const projects = await this.repository.list();
    this.projects = projects.map((project) => project.toSnapshot());
    this.placement = new ProjectPlacement(this.projects, this.git);
  }
}
