import type { MikroORM } from '@mikro-orm/sqlite';
import type { ServicesRun, TestEnvironmentStore } from '../../application/test-environment.service.ts';
import type { TestEnvironment } from '../../domain/test-services.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';

/** Environnement et dernier lancement de chaque dépôt, dans la table des réglages du poste. */
export class MikroOrmTestEnvironmentStore implements TestEnvironmentStore {
  constructor(private readonly orm: MikroORM) {}

  async environmentOf(repository: string): Promise<null | TestEnvironment> {
    return this.read<TestEnvironment>(`testEnvironment.${repository}`);
  }

  async saveEnvironment(repository: string, environment: TestEnvironment): Promise<void> {
    await this.write(`testEnvironment.${repository}`, environment);
  }

  async lastRunOf(repository: string): Promise<null | ServicesRun> {
    const run = await this.read<Omit<ServicesRun, 'at' | 'removedAt'> & { at: string; removedAt: null | string }>(
      `testEnvironment.${repository}.lastRun`,
    );
    return run ? { ...run, at: new Date(run.at), removedAt: run.removedAt ? new Date(run.removedAt) : null } : null;
  }

  async saveLastRun(repository: string, run: ServicesRun): Promise<void> {
    await this.write(`testEnvironment.${repository}.lastRun`, run);
  }

  private async read<T>(key: string): Promise<null | T> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key });
    return row ? (JSON.parse(row.value) as T) : null;
  }

  private async write(key: string, value: unknown): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key, value: JSON.stringify(value) });
  }
}
