import type { MikroORM } from '@mikro-orm/sqlite';
import type { ArchitectureStore, DecisionRepository, SocleRepository } from '../../application/context.service.ts';
import type { Architecture } from '../../domain/context-text.ts';
import type { SocleScope, SocleSnapshot } from '../../domain/socle.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';
import { Decision, type DecisionSnapshot } from '../../domain/decision.ts';
import { type DecisionRow, DecisionSchema, SocleSchema } from './context.schema.ts';

function toDecision(row: DecisionRow): Decision {
  return Decision.restore({
    ...row,
    target: row.target as DecisionSnapshot['target'],
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
        target: { ...snapshot.target },
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

/** Place d'un dépôt dans l'architecture, dans la table des réglages du poste. */
export class MikroOrmArchitectureStore implements ArchitectureStore {
  constructor(private readonly orm: MikroORM) {}

  async of(repository: string): Promise<Architecture> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key: `context.architecture.${repository}` });
    return row ? (JSON.parse(row.value) as Architecture) : { calls: [], calledBy: [] };
  }

  async save(repository: string, architecture: Architecture): Promise<void> {
    await this.orm.em
      .fork()
      .upsert(SettingSchema, { key: `context.architecture.${repository}`, value: JSON.stringify(architecture) });
  }
}
