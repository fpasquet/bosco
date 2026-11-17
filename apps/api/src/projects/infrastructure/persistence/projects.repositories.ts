import type { MikroORM } from '@mikro-orm/sqlite';
import type {
  DiscoveryToImport,
  GroupRepository,
  IgnoredFolders,
  ProjectRepository,
  SoclesToImport,
} from '../../application/ports.ts';
import type { DiscoverySettings } from '../../domain/discovered-import.ts';
import type { RetiredSocle, RetiredSocleDecision } from '../../domain/socle-import.ts';
import { SocleSchema } from '../../../shared/infrastructure/persistence/retired.schema.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';
import { Group } from '../../domain/group.ts';
import { Project, type ProjectPlaceChoice } from '../../domain/project.ts';
import { GroupProjectSchema, IgnoredFolderSchema, ProjectGroupSchema, ProjectSchema } from './projects.schema.ts';

/** Colonne libre en base : seule une place connue est reprise. */
function placeOf(value: null | string): null | ProjectPlaceChoice {
  return value === 'sandbox' || value === 'workstation' ? value : null;
}

export class MikroOrmProjectRepository implements ProjectRepository {
  constructor(private readonly orm: MikroORM) {}

  async list(): Promise<Project[]> {
    const rows = await this.orm.em.fork().find(ProjectSchema, {}, { orderBy: { id: 'asc' } });
    return rows.map((row) => Project.restore({ ...row, place: placeOf(row.place) }));
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

/** Marque posée par la migration des groupes : les socles restent à reprendre en groupes. */
const SOCLES_PENDING_KEY = 'groups.importSocles';

/** Une version de décision telle qu'elle est gardée en JSON. */
function lastVersion(versions: unknown): null | { decision: string; title: string } {
  const list: unknown = typeof versions === 'string' ? JSON.parse(versions) : versions;
  if (!Array.isArray(list)) return null;
  const last: unknown = list.at(-1);
  if (typeof last !== 'object' || last === null) return null;
  const { decision, title } = last as Record<string, unknown>;
  return typeof title === 'string' && typeof decision === 'string' ? { decision, title } : null;
}

/**
 * Socles et décisions acceptées de chacun, lus une fois dans les tables d'avant les groupes. La table des décisions
 * appartient au contexte des agents : elle est lue ici sans son schéma, colonne par colonne.
 */
export class MikroOrmSoclesToImport implements SoclesToImport {
  constructor(private readonly orm: MikroORM) {}

  async pending(): Promise<null | { decisions: RetiredSocleDecision[]; socles: RetiredSocle[] }> {
    const em = this.orm.em.fork();
    const marker = await em.findOne(SettingSchema, { key: SOCLES_PENDING_KEY });
    if (!marker) return null;
    const [socles, rows] = await Promise.all([
      em.find(SocleSchema, {}, { orderBy: { id: 'asc' } }),
      em
        .getConnection()
        .execute<{ id: number; target: string; versions: string }[]>(
          "select id, target, versions from decision where state = 'accepted' order by id",
        ),
    ]);
    const decisions = rows.flatMap((row) => {
      const target = JSON.parse(row.target) as { id?: unknown; kind?: unknown };
      const version = lastVersion(row.versions);
      return target.kind === 'socle' && typeof target.id === 'number' && version
        ? [{ id: row.id, socle: target.id, ...version }]
        : [];
    });
    return {
      decisions,
      socles: socles.map(({ id, inherits, name, projects, scope }) => ({ id, inherits, name, projects, scope })),
    };
  }

  async settle(): Promise<void> {
    await this.orm.em.fork().nativeDelete(SettingSchema, { key: SOCLES_PENDING_KEY });
  }
}
