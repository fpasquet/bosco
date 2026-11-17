import type { RepositoryCatalog } from './ports.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import {
  DEFAULT_ENVIRONMENT,
  isImage,
  planOf,
  type ServiceLaunch,
  type TestEnvironment,
  type TestService,
  type TestServicesMode,
} from '../domain/test-services.ts';

/** Dernier lancement des services d'un dépôt (E12a) ; removedAt une fois la tâche finie. */
export interface ServicesRun {
  at: Date;
  launches: ServiceLaunch[];
  removedAt: Date | null;
  taskId: number;
}

export interface TestEnvironmentStore {
  environmentOf(repository: string): Promise<null | TestEnvironment>;
  lastRunOf(repository: string): Promise<null | ServicesRun>;
  saveEnvironment(repository: string, environment: TestEnvironment): Promise<void>;
  saveLastRun(repository: string, run: ServicesRun): Promise<void>;
}

/** Fichier des services de test d'un dépôt, déjà lu et réduit aux options sûres. */
export interface ServicesFile {
  read(repositoryRoot: string): Promise<{ branch: null | string; file: null | string; services: TestService[] }>;
}

export class InvalidEnvironment extends DomainError {
  constructor(message: string) {
    super('invalid_environment', message);
  }
}

export class UnknownRepository extends DomainError {
  constructor(name: string) {
    super('unknown_repository', `No repository ${name}`);
  }
}

export interface EnvironmentView {
  branch: null | string;
  environment: TestEnvironment;
  excluded: { name: string; reason: string }[];
  file: null | string;
  lastRun: null | ServicesRun;
  launched: TestService[];
  removed: string[];
  repository: string;
  /** Tous les services du fichier, pour « Choisir » */
  services: TestService[];
}

/** Environnement de test des dépôts (E12a) : image de l'agent et services lancés autour de lui. */
export class TestEnvironmentService {
  constructor(
    private readonly store: TestEnvironmentStore,
    private readonly file: ServicesFile,
    private readonly catalog: RepositoryCatalog,
    private readonly clock: { now(): Date },
  ) {}

  async view(repository: string): Promise<EnvironmentView> {
    const root = await this.rootOf(repository);
    const environment = (await this.store.environmentOf(repository)) ?? DEFAULT_ENVIRONMENT;
    const { branch, file, services } = await this.file.read(root);
    const plan = planOf(services, environment);
    return {
      repository,
      branch,
      file,
      environment,
      services,
      launched: plan.launched,
      excluded: plan.excluded,
      removed: plan.removed,
      lastRun: await this.store.lastRunOf(repository),
    };
  }

  async update(
    repository: string,
    changes: { image?: null | string; mode?: TestServicesMode; selected?: string[] },
  ): Promise<EnvironmentView> {
    await this.rootOf(repository);
    const current = (await this.store.environmentOf(repository)) ?? DEFAULT_ENVIRONMENT;
    const image = changes.image === undefined ? current.image : changes.image?.trim() || null;
    if (image && !isImage(image))
      throw new InvalidEnvironment('Un nom d’image seul : php:8.4-cli ou ghcr.io/equipe/agent:2.');
    await this.store.saveEnvironment(repository, {
      image,
      mode: changes.mode ?? current.mode,
      selected: changes.selected ?? current.selected,
    });
    return this.view(repository);
  }

  /** Ce que le worker lance pour une tâche du dépôt : lu au lancement, dans le dépôt de la personne. */
  async forTask(repository: {
    name: string;
    root: string;
  }): Promise<{ image: null | string; services: TestService[] }> {
    const environment = (await this.store.environmentOf(repository.name)) ?? DEFAULT_ENVIRONMENT;
    if (environment.mode === 'none') return { image: environment.image, services: [] };
    const { services } = await this.file.read(repository.root);
    return { image: environment.image, services: planOf(services, environment).launched };
  }

  async launched(repository: string, taskId: number, launches: ServiceLaunch[] | 'removed'): Promise<void> {
    if (launches === 'removed') {
      const last = await this.store.lastRunOf(repository);
      if (last?.taskId === taskId) await this.store.saveLastRun(repository, { ...last, removedAt: this.clock.now() });
      return;
    }
    await this.store.saveLastRun(repository, { taskId, at: this.clock.now(), launches, removedAt: null });
  }

  private async rootOf(repository: string): Promise<string> {
    const known = await this.catalog.list();
    const found = known.find((candidate) => candidate.name === repository);
    if (!found) throw new UnknownRepository(repository);
    return found.root;
  }
}
