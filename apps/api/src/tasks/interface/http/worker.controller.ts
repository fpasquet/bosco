import { Controller, Get, Inject, Post } from '@nestjs/common';
import type { WorkerStatusDto } from '@bosco/domain';
import type { IsolationService } from '../../application/isolation.service.ts';
import type { QuotaService } from '../../application/quota.service.ts';
import type { WorkerService, WorkerStatus } from '../../application/worker.service.ts';
import { ISOLATION_SERVICE, QUOTA_SERVICE, WORKER_SERVICE } from '../../tokens.ts';

/** État du worker (E5b, E5c) : agents au travail, raison d'une indisponibilité, raison de chaque tâche en file. */
@Controller('api/worker')
export class WorkerController {
  constructor(
    @Inject(WORKER_SERVICE) private readonly worker: WorkerService,
    @Inject(QUOTA_SERVICE) private readonly quota: QuotaService,
    @Inject(ISOLATION_SERVICE) private readonly isolation: IsolationService,
  ) {}

  /** Quota de l'abonnement par défaut, montré par l'indicateur du worker (CA-TACH-102). */
  private async withQuota(status: WorkerStatus): Promise<WorkerStatusDto> {
    const path = this.isolation.profileOf(null);
    const usage = this.quota.usage(path);
    const subscriptions = await this.isolation.subscriptions();
    const label = subscriptions.find((subscription) => subscription.path === path)?.label ?? path;
    const quota =
      usage.fiveHour || usage.sevenDay
        ? { label, fiveHour: usage.fiveHour?.usage ?? null, sevenDay: usage.sevenDay?.usage ?? null }
        : null;
    return { ...status, quota };
  }

  @Get()
  status(): Promise<WorkerStatusDto> {
    return this.withQuota(this.worker.current());
  }

  /** « Réessayer » : le worker revérifie tout de suite (CA-TACH-16). */
  @Post('check')
  async check(): Promise<WorkerStatusDto> {
    const status = await this.worker.tick();
    return this.withQuota(status);
  }
}
