import type { MikroORM } from '@mikro-orm/sqlite';
import type { ArchitectureStore, DecisionRepository, SocleRepository } from '../../application/context.service.ts';
import type { Architecture } from '../../domain/context-text.ts';
import type { SocleScope, SocleSnapshot } from '../../domain/socle.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';
import { Decision, type DecisionSnapshot } from '../../domain/decision.ts';
import { type DecisionRow, DecisionSchema, SocleSchema } from './context.schema.ts';

// Cible d'une décision en base : « repository » y désigne toujours un projet, écrit avant que les dépôts deviennent
// des projets ; le genre gardé en base ne change pas pour relire les décisions du poste sans migration.
const STORED_PROJECT_KIND = 'repository';

function targetOf(stored: DecisionRow['target']): DecisionSnapshot['target'] {
  const target = stored as DecisionSnapshot['target'] | { kind: typeof STORED_PROJECT_KIND; name: string };
  return target.kind === STORED_PROJECT_KIND ? { kind: 'project', name: target.name } : target;
}

function storedTarget(target: DecisionSnapshot['target']): DecisionRow['target'] {
  return target.kind === 'project' ? { kind: STORED_PROJECT_KIND, name: target.name } : { ...target };
}

function toDecision(row: DecisionRow): Decision {
  return Decision.restore({
    ...row,
    target: targetOf(row.target),
    state: row.state as DecisionSnapshot['state'],
    versions: (row.versions as unknown as (Omit<DecisionSnapshot['versions'][number], 'at'> & { at: string })[]).map(
      (version) => ({ ...version, at: new Date(version.at) }),
    ),
  });
}

export class MikroOrmDecisionRepository implements DecisionRepository {
  constructor(private readonly orm: MikroORM) {}

  async list(): Promise<Decision[]> {
    const rows = await this.orm.em.fork().find(DecisionSchema, {}, { orderBy: { id: 'asc' } });
    return rows.map(toDecision);
  }

  async nextId(): Promise<number> {
    const rows = await this.orm.em.fork().find(DecisionSchema, {}, { orderBy: { id: 'desc' }, limit: 1 });
    return (rows[0]?.id ?? 0) + 1;
  }

  async save(decisions: readonly Decision[]): Promise<void> {
    const em = this.orm.em.fork();
    for (const decision of decisions) {
      const snapshot = decision.toSnapshot();
      await em.upsert(DecisionSchema, {
        ...snapshot,
        target: storedTarget(snapshot.target),
        versions: snapshot.versions.map((version) => ({ ...version, at: version.at.toISOString() })),
      });
    }
  }
}

export class MikroOrmSocleRepository implements SocleRepository {
  constructor(private readonly orm: MikroORM) {}

  async list(): Promise<SocleSnapshot[]> {
    const rows = await this.orm.em.fork().find(SocleSchema, {}, { orderBy: { id: 'asc' } });
    return rows.map((row) => ({ ...row, scope: row.scope as SocleScope }));
  }

  async nextId(): Promise<number> {
    const rows = await this.orm.em.fork().find(SocleSchema, {}, { orderBy: { id: 'desc' }, limit: 1 });
    return (rows[0]?.id ?? 0) + 1;
  }

  async save(socle: SocleSnapshot): Promise<void> {
    await this.orm.em.fork().upsert(SocleSchema, { ...socle });
  }
}

/** Place d'un projet dans l'architecture, dans la table des réglages du poste. */
export class MikroOrmArchitectureStore implements ArchitectureStore {
  constructor(private readonly orm: MikroORM) {}

  async of(project: string): Promise<Architecture> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key: `context.architecture.${project}` });
    return row ? (JSON.parse(row.value) as Architecture) : { calls: [], calledBy: [] };
  }

  async save(project: string, architecture: Architecture): Promise<void> {
    await this.orm.em
      .fork()
      .upsert(SettingSchema, { key: `context.architecture.${project}`, value: JSON.stringify(architecture) });
  }
}
