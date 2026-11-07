import { Controller, Get, Inject, Post } from '@nestjs/common';
import type { WorkerService, WorkerStatus } from '../../application/worker.service.ts';
import { WORKER_SERVICE } from '../../tokens.ts';

/** État du worker (E5b, E5c) : agents au travail, raison d'une indisponibilité, raison de chaque tâche en file. */
@Controller('api/worker')
export class WorkerController {
  constructor(@Inject(WORKER_SERVICE) private readonly worker: WorkerService) {}

  @Get()
  status(): WorkerStatus {
    return this.worker.current();
  }

  /** « Réessayer » : le worker revérifie tout de suite (CA-TACH-16). */
  @Post('check')
  check(): Promise<WorkerStatus> {
    return this.worker.tick();
  }
}
