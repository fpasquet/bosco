import type { MikroORM } from '@mikro-orm/sqlite';
import type { DiscoveryToImport, IgnoredFolders, ProjectRepository } from '../../application/ports.ts';
import type { DiscoverySettings } from '../../domain/discovered-import.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';
import { Project } from '../../domain/project.ts';
import { IgnoredFolderSchema, ProjectSchema } from './projects.schema.ts';

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
