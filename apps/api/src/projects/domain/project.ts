import type { FolderPath } from './folder.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import { isDomainName } from '../../shared/domain/domain-name.ts';

export interface ProjectSnapshot {
  addedAt: Date;
  /** Domaines propres au projet, ajoutés à la liste générale pour ses bacs à sable */
  domains: string[];
  /** Le dossier est un dépôt git : seuls ceux-là tournent en bac à sable */
  git: boolean;
  id: number;
  /** Nom affiché, unique : celui du dossier, ou précédé du dossier parent quand il est déjà pris */
  name: string;
  /** Chemin absolu du dossier, unique */
  path: string;
  /** Montré dans la barre latérale même sans session ouverte */
  pinned: boolean;
  /** Où tourne par défaut une nouvelle session : le dernier choix fait ; null avant le premier */
  place: null | ProjectPlaceChoice;
  /** Branche que copie un bac à sable ; null : la branche courante du dossier */
  startBranch: null | string;
}

export type ProjectPlaceChoice = 'sandbox' | 'workstation';

/** Ce qui se change d'un projet : sa place dans la barre latérale et les valeurs par défaut de ses sessions. */
export interface ProjectChanges {
  pinned?: boolean;
  place?: null | ProjectPlaceChoice;
  startBranch?: null | string;
}

export class ProjectAlreadyAdded extends DomainError {
  constructor(path: string) {
    super('projectAlreadyAdded', `The folder ${path} is already a project`);
  }
}

export class ProjectHasRunningSession extends DomainError {
  constructor(name: string) {
    super('projectHasRunningSession', `A session piloted by Bosco still runs in ${name}`);
  }
}

export class InvalidStartBranch extends DomainError {
  constructor() {
    super('invalidStartBranch', 'The start branch is not a valid branch name');
  }
}

export class InvalidProjectDomain extends DomainError {
  constructor() {
    super('invalidProjectDomain', 'A domain name alone, without protocol or path: pypi.org or *.github.com');
  }
}

export class ProjectDomainTaken extends DomainError {
  constructor(domain: string) {
    super('projectDomainTaken', `${domain} is already in the domains of the project`);
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

/** Nom de branche de départ : sans espace ni caractère que git refuse ; vide, la branche courante. */
function startBranchOf(value: null | string): null | string {
  const branch = value?.trim() ?? '';
  if (!branch) return null;
  if (branch.length > 200 || /[\s~^:?*[\\]|\.\.|@\{|^[-/]|[/.]$/.test(branch)) throw new InvalidStartBranch();
  return branch;
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
      domains: [],
      git,
      id,
      name: projectName(
        folder,
        projects.map(({ name }) => name),
      ),
      path: folder.value,
      pinned: false,
      place: null,
      startBranch: null,
    });
  }

  static restore(snapshot: ProjectSnapshot): Project {
    return new Project({ ...snapshot, domains: [...snapshot.domains] });
  }

  get id(): number {
    return this.snapshot.id;
  }

  get name(): string {
    return this.snapshot.name;
  }

  /**
   * Épingle le projet dans la barre latérale, ou l'en retire (sans rien retirer d'autre), et règle les valeurs par
   * défaut de ses sessions ; un sans-git ne tourne jamais en bac à sable, la place proposée reste donc le poste.
   */
  change(changes: ProjectChanges): void {
    if (changes.pinned !== undefined) this.snapshot.pinned = changes.pinned;
    if (changes.place !== undefined) this.rememberPlace(changes.place);
    if (changes.startBranch !== undefined) this.snapshot.startBranch = startBranchOf(changes.startBranch);
  }

  /** Un domaine propre au projet : un nom, ou « *. » et un nom ; il vaut tout de suite pour ses bacs à sable. */
  addDomain(value: string): void {
    const domain = value.trim().toLowerCase();
    if (!isDomainName(domain)) throw new InvalidProjectDomain();
    if (this.snapshot.domains.includes(domain)) throw new ProjectDomainTaken(domain);
    this.snapshot.domains = [...this.snapshot.domains, domain];
  }

  removeDomain(value: string): void {
    const domain = value.trim().toLowerCase();
    this.snapshot.domains = this.snapshot.domains.filter((candidate) => candidate !== domain);
  }

  /** Dernier choix de « Où elle tourne » : la prochaine session du projet le reprend. */
  rememberPlace(place: null | ProjectPlaceChoice): void {
    this.snapshot.place = place === 'sandbox' && !this.snapshot.git ? 'workstation' : place;
  }

  toSnapshot(): ProjectSnapshot {
    return { ...this.snapshot, domains: [...this.snapshot.domains] };
  }
}
