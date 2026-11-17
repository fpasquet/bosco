import type { GroupRepository } from './ports.ts';
import { Group, type GroupSettings, type GroupSnapshot, UnknownGroup } from '../domain/group.ts';
import { type ProjectSnapshot, UnknownProject } from '../domain/project.ts';

/** Un groupe et ses projets, dans l'ordre : tous les projets pour « Tous les projets ». */
export interface GroupView extends Omit<GroupSnapshot, 'projects'> {
  projects: ProjectSnapshot[];
}

/** Instructions transmises aux agents d'un projet, d'un groupe dont il fait partie. */
export interface GroupInstructions {
  id: number;
  instructions: string;
  name: string;
  system: boolean;
}

/** Projets ajoutés, tenus par le service des projets. */
export interface KnownProjects {
  listProjects(): ProjectSnapshot[];
}

/**
 * Groupes de projets : un nom unique, des projets ordonnés dont le premier est le principal, un
 * profil par défaut, la présence dans la barre latérale et des instructions transmises aux agents de ses projets.
 */
export class GroupService {
  constructor(
    private readonly groups: GroupRepository,
    private readonly projects: KnownProjects,
  ) {}

  /** « Tous les projets » existe toujours : créé au premier démarrage (et après une remise à zéro des scénarios). */
  async load(): Promise<void> {
    const groups = await this.groups.list();
    if (groups.some((group) => group.toSnapshot().system)) return;
    const id = await this.groups.nextId();
    await this.groups.save([Group.allProjects(id)]);
  }

  /** Les groupes dans l'ordre de leur création, « Tous les projets » en dernier. */
  async listGroups(): Promise<GroupView[]> {
    const groups = await this.groups.list();
    return groups
      .map((group) => this.view(group))
      .toSorted((a, b) => Number(a.system) - Number(b.system) || a.id - b.id);
  }

  async getGroup(id: number): Promise<GroupView> {
    const group = await this.find(id);
    return this.view(group);
  }

  /** Nouveau groupe : le premier projet coché est le principal ; il n'a pas d'instructions. */
  async createGroup(input: { description: null | string; name: string; projects: number[] }): Promise<GroupView> {
    this.checkProjects(input.projects);
    const [groups, id] = await Promise.all([this.groups.list(), this.groups.nextId()]);
    const group = Group.create({ ...input, id, others: groups.map((other) => other.toSnapshot()) });
    await this.groups.save([group]);
    return this.view(group);
  }

  async changeGroup(id: number, settings: GroupSettings): Promise<GroupView> {
    const groups = await this.groups.list();
    const group = this.pick(groups, id);
    const others = groups.filter((other) => other.id !== id).map((other) => other.toSnapshot());
    group.change(settings, others);
    await this.groups.save([group]);
    return this.view(group);
  }

  /** Instructions changées : seuls les agents lancés ensuite les reçoivent. */
  async writeInstructions(id: number, instructions: string): Promise<GroupView> {
    const group = await this.find(id);
    group.writeInstructions(instructions);
    await this.groups.save([group]);
    return this.view(group);
  }

  /** Projets du groupe dans leur nouvel ordre : ajout, retrait ou nouveau projet principal. */
  async arrangeProjects(id: number, projects: number[]): Promise<GroupView> {
    this.checkProjects(projects);
    const group = await this.find(id);
    group.arrange(projects);
    await this.groups.save([group]);
    return this.view(group);
  }

  /** Supprimer un groupe ne retire aucun projet. */
  async deleteGroup(id: number): Promise<void> {
    const group = await this.find(id);
    group.checkDeletable();
    await this.groups.remove(id);
  }

  /** Instructions qui arrivent aux agents d'un projet : « Tous les projets », puis chacun de ses groupes. */
  async instructionsOf(project: string): Promise<GroupInstructions[]> {
    const found = this.projects.listProjects().find(({ name }) => name === project);
    const groups = await this.groups.list();
    return groups
      .map((group) => group.toSnapshot())
      .filter((group) => group.system || (found !== undefined && group.projects.includes(found.id)))
      .toSorted((a, b) => Number(b.system) - Number(a.system) || a.id - b.id)
      .map(({ id, instructions, name, system }) => ({ id, instructions, name, system }));
  }

  private checkProjects(ids: readonly number[]): void {
    const known = new Set(this.projects.listProjects().map(({ id }) => id));
    const unknown = ids.find((id) => !known.has(id));
    if (unknown !== undefined) throw new UnknownProject(unknown);
  }

  private view(group: Group): GroupView {
    const snapshot = group.toSnapshot();
    const projects = this.projects.listProjects();
    return {
      ...snapshot,
      projects: snapshot.system
        ? projects.toSorted((a, b) => a.name.localeCompare(b.name, 'fr'))
        : snapshot.projects.flatMap((id) => projects.filter((project) => project.id === id)),
    };
  }

  private async find(id: number): Promise<Group> {
    const groups = await this.groups.list();
    return this.pick(groups, id);
  }

  private pick(groups: readonly Group[], id: number): Group {
    const group = groups.find((candidate) => candidate.id === id);
    if (!group) throw new UnknownGroup(id);
    return group;
  }
}
