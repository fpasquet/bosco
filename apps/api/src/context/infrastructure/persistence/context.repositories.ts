import type { MikroORM } from '@mikro-orm/sqlite';
import type { ArchitectureStore, DecisionRepository } from '../../application/context.service.ts';
import type { Architecture } from '../../domain/context-text.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';
import { Decision, type DecisionSnapshot } from '../../domain/decision.ts';
import { type DecisionRow, DecisionSchema } from './context.schema.ts';

// Cible d'une décision en base : « repository » y désigne toujours un projet, écrit avant que les dépôts deviennent
// des projets ; le genre gardé en base ne change pas pour relire les décisions du poste sans migration.
const STORED_PROJECT_KIND = 'repository';

/** Projet d'une décision ; null pour une décision d'un ancien socle, reprise dans les instructions d'un groupe. */
function targetOf(stored: DecisionRow['target']): DecisionSnapshot['target'] | null {
  const { kind, name } = stored;
  return (kind === STORED_PROJECT_KIND || kind === 'project') && typeof name === 'string'
    ? { kind: 'project', name }
    : null;
}

function storedTarget(target: DecisionSnapshot['target']): DecisionRow['target'] {
  return { kind: STORED_PROJECT_KIND, name: target.name };
}

function toDecision(row: DecisionRow, target: DecisionSnapshot['target']): Decision {
  return Decision.restore({
    id: row.id,
    fromTask: row.fromTask,
    reason: row.reason,
    replacedBy: row.replacedBy,
    specifies: row.specifies,
    target,
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
    return rows.flatMap((row) => {
      const target = targetOf(row.target);
      return target ? [toDecision(row, target)] : [];
    });
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
