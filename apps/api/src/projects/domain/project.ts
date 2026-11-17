import type { FolderPath } from './folder.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';

export interface ProjectSnapshot {
  addedAt: Date;
  /** Le dossier est un dépôt git : seuls ceux-là tournent en bac à sable */
  git: boolean;
  id: number;
  /** Nom affiché, unique : celui du dossier, ou précédé du dossier parent quand il est déjà pris */
  name: string;
  /** Chemin absolu du dossier, unique */
  path: string;
  /** Montré dans la barre latérale même sans session ouverte */
  pinned: boolean;
}

export class ProjectAlreadyAdded extends DomainError {
  constructor(path: string) {
    super('projectAlreadyAdded', `The folder ${path} is already a project`);
  }
}

export class UnknownProject extends DomainError {
  constructor(id: number) {
    super('unknownProject', `No project ${id}`);
  }
}

/** Nom d'un nouveau projet : celui du dossier, « parent/nom » s'il est pris, puis numéroté. */
export function projectName(folder: FolderPath, taken: readonly string[]): string {
  const names = new Set(taken);
  const candidates = [folder.name, ...(folder.parentName ? [`${folder.parentName}/${folder.name}`] : [])];
  const free = candidates.find((candidate) => !names.has(candidate));
  if (free) return free;
  for (let index = 2; ; index++) {
    const numbered = `${folder.name} (${index})`;
    if (!names.has(numbered)) return numbered;
  }
}

/** Un projet : un dossier que la personne a ajouté à Bosco. Le retirer ne touche à rien sur le poste. */
export class Project {
  private constructor(private readonly snapshot: ProjectSnapshot) {}

  /** Ajoute un dossier comme projet ; un dossier ne l'est qu'une fois, et deux projets n'ont pas le même nom. */
  static add(input: {
    addedAt: Date;
    folder: FolderPath;
    git: boolean;
    id: number;
    projects: readonly ProjectSnapshot[];
  }): Project {
    const { addedAt, folder, git, id, projects } = input;
    if (projects.some(({ path }) => path === folder.value)) throw new ProjectAlreadyAdded(folder.value);
    return new Project({
      addedAt,
      git,
      id,
      name: projectName(
        folder,
        projects.map(({ name }) => name),
      ),
      path: folder.value,
      pinned: false,
    });
  }

  static restore(snapshot: ProjectSnapshot): Project {
    return new Project({ ...snapshot });
  }

  get id(): number {
    return this.snapshot.id;
  }

  toSnapshot(): ProjectSnapshot {
    return { ...this.snapshot };
  }
}
