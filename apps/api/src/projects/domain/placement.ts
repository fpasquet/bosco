import { isInside, relativePath } from './folder.ts';

/** Ce que git dit d'un dossier : la racine du dépôt qui le contient, l'origine d'un worktree. */
export interface GitOrigins {
  /** Dépôt d'origine d'un worktree ; null pour un dépôt ordinaire */
  originOf(root: string): null | string;
  /** Racine du dépôt git qui contient un dossier ; null hors de git */
  rootOf(path: string): null | string;
}

/** Dossier de travail d'une session, tel que les transcripts le donnent, et la racine git notée à la lecture. */
export interface SessionFolder {
  gitRoot: null | string;
  lastEventAt: Date;
  path: null | string;
}

export interface PlacedProject {
  id: number;
  name: string;
  path: string;
}

/** Projet d'une session et dossier de travail à l'intérieur (« packages/api ») */
export interface ProjectPlace {
  folder: string;
  id: number;
  name: string;
  root: string;
}

/**
 * Range une session dans le projet qui contient son dossier de travail : le plus profond l'emporte, et un worktree git
 * va avec son dépôt d'origine. Hors de tout projet, elle n'a pas de place (« Hors projet »).
 */
export class ProjectPlacement {
  private readonly deepestFirst: PlacedProject[];

  constructor(
    projects: readonly PlacedProject[],
    private readonly git: GitOrigins,
  ) {
    this.deepestFirst = projects.toSorted((a, b) => b.path.length - a.path.length);
  }

  placeOf(gitRoot: null | string, path: null | string): null | ProjectPlace {
    const work = this.workFolderOf(gitRoot, path);
    if (!work) return null;
    const project = this.deepestFirst.find((candidate) => isInside(work, candidate.path));
    if (!project) return null;
    return { folder: relativePath(work, project.path), id: project.id, name: project.name, root: project.path };
  }

  /**
   * Dossier proposé pour une session hors projet : son dépôt git (celui d'origine pour un worktree), sinon son dossier
   * de travail.
   */
  suggestionOf(gitRoot: null | string, path: null | string): null | { git: boolean; path: string } {
    const root = this.rootOf(gitRoot, path);
    if (root) return { git: true, path: this.git.originOf(root) ?? root };
    return path ? { git: false, path } : null;
  }

  /** Dossier où la session a travaillé ; celui d'un worktree est ramené dans son dépôt d'origine. */
  private workFolderOf(gitRoot: null | string, path: null | string): null | string {
    const root = this.rootOf(gitRoot, path);
    // Un dossier de travail hors de la racine notée (la session a changé de dossier) compte pour sa racine git
    const work = path && (!root || isInside(path, root)) ? path : (root ?? path);
    if (!work) return null;
    const origin = root ? this.git.originOf(root) : null;
    if (!root || !origin || !isInside(work, root)) return work;
    const inside = relativePath(work, root);
    return inside ? `${origin}/${inside}` : origin;
  }

  private rootOf(gitRoot: null | string, path: null | string): null | string {
    return gitRoot ?? (path ? this.git.rootOf(path) : null);
  }
}
