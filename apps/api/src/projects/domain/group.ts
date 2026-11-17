import { DomainError } from '../../shared/domain/domain-error.ts';

/** Nom du groupe système, qui contient toujours tous les projets */
export const ALL_PROJECTS = 'Tous les projets';

export interface GroupSnapshot {
  description: null | string;
  id: number;
  /** Texte libre, une consigne par ligne, transmis aux agents de chacun de ses projets */
  instructions: string;
  name: string;
  /** Profil Claude Code (son dossier) des sessions démarrées avec le groupe ; null : hériter */
  profile: null | string;
  /** Projets dans l'ordre, le premier étant le principal ; vide pour « Tous les projets », qui les contient tous */
  projects: number[];
  /** Montré dans la barre latérale */
  sidebar: boolean;
  /** « Tous les projets » : il n'a que des instructions */
  system: boolean;
}

/** Réglages d'un groupe que la personne change dans son onglet Réglages. */
export interface GroupSettings {
  description?: null | string;
  name?: string;
  profile?: null | string;
  sidebar?: boolean;
}

export class GroupError extends DomainError {}

export class UnknownGroup extends DomainError {
  constructor(id: number) {
    super('unknownGroup', `No group ${id}`);
  }
}

export class GroupNameTaken extends DomainError {
  constructor(name: string) {
    super('groupNameTaken', `A group is already named ${name}`);
  }
}

const sameName = (a: string, b: string) => a.localeCompare(b, 'fr', { sensitivity: 'accent' }) === 0;

/** Nom d'un groupe : non vide, unique parmi les groupes, « Tous les projets » compris. */
function checkName(name: string, others: readonly GroupSnapshot[]): string {
  const clean = name.trim();
  if (!clean) throw new GroupError('groupNameMissing', 'A group needs a name');
  if (others.some((other) => sameName(other.name, clean))) throw new GroupNameTaken(clean);
  return clean;
}

/** Une consigne par ligne : les espaces de fin et les lignes vides du début et de la fin ne comptent pas. */
export function cleanInstructions(text: string): string {
  const lines = text.split('\n').map((line) => line.trimEnd());
  const first = lines.findIndex(Boolean);
  if (first === -1) return '';
  const last = lines.findLastIndex(Boolean);
  return lines.slice(first, last + 1).join('\n');
}

/** Consignes d'un texte d'instructions, une par ligne non vide. */
export function instructionLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Un groupe réunit des projets dans un ordre, le premier étant le principal ; un projet peut être dans plusieurs
 * groupes. « Tous les projets » est un groupe système : il contient toujours tous les projets et n'a que des
 * instructions.
 */
export class Group {
  private constructor(private snapshot: GroupSnapshot) {}

  static create(input: {
    description: null | string;
    id: number;
    name: string;
    others: readonly GroupSnapshot[];
    projects: readonly number[];
  }): Group {
    return new Group({
      id: input.id,
      name: checkName(input.name, input.others),
      description: input.description?.trim() || null,
      projects: [...new Set(input.projects)],
      profile: null,
      sidebar: true,
      instructions: '',
      system: false,
    });
  }

  /** « Tous les projets », créé une fois. */
  static allProjects(id: number, instructions = ''): Group {
    return new Group({
      id,
      name: ALL_PROJECTS,
      description: null,
      projects: [],
      profile: null,
      sidebar: false,
      instructions: cleanInstructions(instructions),
      system: true,
    });
  }

  static restore(snapshot: GroupSnapshot): Group {
    return new Group({ ...snapshot, projects: [...snapshot.projects] });
  }

  get id(): number {
    return this.snapshot.id;
  }

  toSnapshot(): GroupSnapshot {
    return { ...this.snapshot, projects: [...this.snapshot.projects] };
  }

  /** Le projet principal : le dossier de travail des sessions démarrées avec le groupe ; null sans projet. */
  principal(): null | number {
    return this.snapshot.projects[0] ?? null;
  }

  has(project: number): boolean {
    return this.snapshot.projects.includes(project);
  }

  writeInstructions(text: string): void {
    this.snapshot.instructions = cleanInstructions(text);
  }

  change(settings: GroupSettings, others: readonly GroupSnapshot[]): void {
    this.expectOwn();
    if (settings.name !== undefined) this.snapshot.name = checkName(settings.name, others);
    if (settings.description !== undefined) this.snapshot.description = settings.description?.trim() || null;
    if (settings.profile !== undefined) this.snapshot.profile = settings.profile?.trim() || null;
    if (settings.sidebar !== undefined) this.snapshot.sidebar = settings.sidebar;
  }

  /** Nouvel ordre des projets, le premier devenant le principal ; un projet n'y figure qu'une fois. */
  arrange(projects: readonly number[]): void {
    this.expectOwn();
    this.snapshot.projects = [...new Set(projects)];
  }

  /** Un projet retiré de Bosco sort de ses groupes : le suivant devient principal. */
  removeProject(project: number): void {
    this.snapshot.projects = this.snapshot.projects.filter((candidate) => candidate !== project);
  }

  /** Supprimer un groupe ne retire aucun projet ; « Tous les projets » ne se supprime pas. */
  checkDeletable(): void {
    this.expectOwn();
  }

  private expectOwn(): void {
    if (this.snapshot.system)
      throw new GroupError('allProjectsFixed', `${ALL_PROJECTS} always holds every project and only has instructions`);
  }
}
