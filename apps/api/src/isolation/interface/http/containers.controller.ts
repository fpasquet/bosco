import { Controller, Get, Inject, type MessageEvent, Post, Sse } from '@nestjs/common';
import { distinctUntilChanged, filter, map, type Observable } from 'rxjs';
import type { ContainersDto } from '@bosco/domain';
import type { ContainersService, ContainersView } from '../../application/containers.service.ts';
import type { ContainerEventsBus } from '../../infrastructure/container-events.bus.ts';
import { CONTAINER_EVENTS, CONTAINERS_SERVICE } from '../../tokens.ts';

/** Vue des conteneurs en JSON : dates en ISO 8601. */
export function presentContainers(view: ContainersView): ContainersDto {
  return {
    ...view,
    measuredAt: view.measuredAt?.toISOString() ?? null,
    piloted: view.piloted.map((turn) => ({ ...turn, since: turn.since.toISOString() })),
    unreachableSince: view.unreachableSince?.toISOString() ?? null,
  };
}

/** Conteneurs en cours : les bacs à sable et les tours pilotés, mesurés toutes les 5 s. */
@Controller('api/containers')
export class ContainersController {
  constructor(
    @Inject(CONTAINERS_SERVICE) private readonly containers: ContainersService,
    @Inject(CONTAINER_EVENTS) private readonly bus: ContainerEventsBus,
  ) {}

  @Get()
  current(): ContainersDto {
    return presentContainers(this.containers.current());
  }

  /** Flux en direct : la dernière mesure, puis chaque changement. */
  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.bus.views.pipe(
      filter((view): view is ContainersView => view !== null),
      map((view) => JSON.stringify(presentContainers(view))),
      distinctUntilChanged(),
      map((data) => ({ type: 'containers.snapshot', data })),
    );
  }

  /** « Réessayer » quand Docker ne répond pas : nouvelle mesure tout de suite. */
  @Post('check')
  async measure(): Promise<ContainersDto> {
    const view = await this.containers.measure();
    return presentContainers(view);
  }
}
