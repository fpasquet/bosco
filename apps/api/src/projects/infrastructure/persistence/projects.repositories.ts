import type { MikroORM } from '@mikro-orm/sqlite';
import type { DiscoveryToImport, GroupRepository, IgnoredFolders, ProjectRepository } from '../../application/ports.ts';
import type { DiscoverySettings } from '../../domain/discovered-import.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';
import { Group } from '../../domain/group.ts';
import { Project } from '../../domain/project.ts';
import { GroupProjectSchema, IgnoredFolderSchema, ProjectGroupSchema, ProjectSchema } from './projects.schema.ts';

export class MikroOrmProjectRepository implements ProjectRepository {
  constructor(private readonly orm: MikroORM) {}

  async list(): Promise<Project[]> {
    const rows = await this.orm.em.fork().find(ProjectSchema, {}, { orderBy: { id: 'asc' } });
    return rows.map((row) => Project.restore({ ...row }));
  }

  async nextId(): Promise<number> {
    const rows = await this.orm.em.fork().find(ProjectSchema, {}, { orderBy: { id: 'desc' }, limit: 1 });
    return (rows[0]?.id ?? 0) + 1;
  }

  async remove(id: number): Promise<void> {
    await this.orm.em.fork().nativeDelete(ProjectSchema, { id });
  }

  async save(projects: readonly Project[]): Promise<void> {
    const em = this.orm.em.fork();
    for (const project of projects) await em.upsert(ProjectSchema, project.toSnapshot());
  }
}

export class MikroOrmGroupRepository implements GroupRepository {
  constructor(private readonly orm: MikroORM) {}

  async list(): Promise<Group[]> {
    const em = this.orm.em.fork();
    const [rows, links] = await Promise.all([
      em.find(ProjectGroupSchema, {}, { orderBy: { id: 'asc' } }),
      em.find(GroupProjectSchema, {}, { orderBy: { rank: 'asc' } }),
    ]);
    return rows.map((row) =>
      Group.restore({
        ...row,
        projects: links.filter((link) => link.groupId === row.id).map((link) => link.projectId),
      }),
    );
  }

  async nextId(): Promise<number> {
    const rows = await this.orm.em.fork().find(ProjectGroupSchema, {}, { orderBy: { id: 'desc' }, limit: 1 });
    return (rows[0]?.id ?? 0) + 1;
  }

  async remove(id: number): Promise<void> {
    await this.orm.em.fork().transactional(async (em) => {
      await em.nativeDelete(GroupProjectSchema, { groupId: id });
      await em.nativeDelete(ProjectGroupSchema, { id });
    });
  }

  /** Un groupe et ses projets s'enregistrent ensemble ; les rangs sont réécrits dans l'ordre du groupe. */
  async save(groups: readonly Group[]): Promise<void> {
    await this.orm.em.fork().transactional(async (em) => {
      for (const group of groups) {
        const { projects, ...row } = group.toSnapshot();
        await em.upsert(ProjectGroupSchema, row);
        await em.nativeDelete(GroupProjectSchema, { groupId: row.id });
        for (const [rank, projectId] of projects.entries())
          await em.insert(GroupProjectSchema, { groupId: row.id, projectId, rank });
      }
    });
  }
}

export class MikroOrmIgnoredFolders implements IgnoredFolders {
  constructor(private readonly orm: MikroORM) {}

  async ignore(path: string, at: Date): Promise<void> {
    await this.orm.em.fork().upsert(IgnoredFolderSchema, { path, ignoredAt: at });
  }

  async list(): Promise<string[]> {
    const rows = await this.orm.em.fork().find(IgnoredFolderSchema, {}, { orderBy: { path: 'asc' } });
    return rows.map((row) => row.path);
  }

  async restore(paths: readonly string[]): Promise<void> {
    if (paths.length === 0) return;
    await this.orm.em.fork().nativeDelete(IgnoredFolderSchema, { path: { $in: [...paths] } });
  }
}

/** Marque posée par la migration de la table des projets : la reprise des dépôts découverts reste à faire. */
const PENDING_KEY = 'projects.importDiscovered';
/** Réglages de l'ancienne découverte, sous la clé écrite avant que les dépôts deviennent des projets */
const DISCOVERY_KEY = 'sessions.repositories';

export class MikroOrmDiscoveryToImport implements DiscoveryToImport {
  constructor(private readonly orm: MikroORM) {}

  async pending(): Promise<null | Partial<DiscoverySettings>> {
    const rows = await this.orm.em.fork().find(SettingSchema, { key: { $in: [PENDING_KEY, DISCOVERY_KEY] } });
    if (!rows.some((row) => row.key === PENDING_KEY)) return null;
    return discovery(rows.find((row) => row.key === DISCOVERY_KEY)?.value);
  }

  async settle(): Promise<void> {
    await this.orm.em.fork().nativeDelete(SettingSchema, { key: PENDING_KEY });
  }
}

/** Réglages gardés en JSON ; une valeur illisible laisse ceux par défaut. */
function discovery(value: string | undefined): Partial<DiscoverySettings> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const record = parsed as Record<string, unknown>;
    const strings = (key: keyof DiscoverySettings) =>
      Array.isArray(record[key]) && record[key].every((item) => typeof item === 'string') ? { [key]: record[key] } : {};
    const flag = (key: keyof DiscoverySettings) => (typeof record[key] === 'boolean' ? { [key]: record[key] } : {});
    return {
      ...flag('gitOnly'),
      ...flag('attachWorktrees'),
      ...strings('roots'),
      ...strings('excluded'),
      ...strings('hidden'),
    };
  } catch {
    return {};
  }
}
