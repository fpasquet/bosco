import {
  Controller,
  Delete,
  Get,
  Inject,
  type MessageEvent,
  NotFoundException,
  Param,
  Post,
  Sse,
} from '@nestjs/common';
import { distinctUntilChanged, filter, map, type Observable } from 'rxjs';
import type { ContainersDto } from '@bosco/domain';
import type { ContainersService, ContainersView } from '../../application/containers.service.ts';
import type { ContainerEventsBus } from '../../infrastructure/container-events.bus.ts';
import { UnknownContainer } from '../../domain/containers.ts';
import { CONTAINER_EVENTS, CONTAINERS_SERVICE } from '../../tokens.ts';

/** Vue des conteneurs en JSON : dates en ISO 8601. */
export function presentContainers(view: ContainersView): ContainersDto {
  return {
    ...view,
    leftovers: view.leftovers.map((leftover) => ({
      ...leftover,
      task: leftover.task ? { ...leftover.task, endedAt: leftover.task.endedAt.toISOString() } : null,
    })),
    measuredAt: view.measuredAt?.toISOString() ?? null,
    nextCleanupAt: view.nextCleanupAt?.toISOString() ?? null,
    piloted: view.piloted.map((turn) => ({ ...turn, since: turn.since.toISOString() })),
    unreachableSince: view.unreachableSince?.toISOString() ?? null,
  };
}

async function guard<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof UnknownContainer) throw new NotFoundException(error.message);
    throw error;
  }
}

/** Conteneurs en cours (E19, E13d) : ce que Bosco fait tourner, mesuré toutes les 5 s, et les actions possibles. */
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

  /** Flux en direct : la dernière mesure, puis chaque changement (DT-06). */
  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.bus.views.pipe(
      filter((view): view is ContainersView => view !== null),
      map((view) => JSON.stringify(presentContainers(view))),
      distinctUntilChanged(),
      map((data) => ({ type: 'containers.snapshot', data })),
    );
  }

  /** « Réessayer » quand Docker ne répond pas : nouvelle mesure tout de suite (CA-CONT-82). */
  @Post('check')
  async measure(): Promise<ContainersDto> {
    const view = await this.containers.measure();
    return presentContainers(view);
  }

  /** Redémarre un service de test sans le recréer (E19b). */
  @Post(':name/restart')
  async restartService(@Param('name') name: string): Promise<ContainersDto> {
    const view = await guard(this.containers.restartService(name));
    return presentContainers(view);
  }

  /** Les 300 dernières lignes du journal d'un service de test. */
  @Get(':name/logs')
  async logs(@Param('name') name: string): Promise<{ text: string }> {
    const text = await guard(this.containers.logs(name));
    return { text };
  }

  /** « Tout supprimer maintenant » : les conteneurs restés après leur tâche (E19d). */
  @Delete('leftovers')
  async removeLeftovers(): Promise<ContainersDto> {
    const view = await this.containers.removeLeftovers();
    return presentContainers(view);
  }

  /** « Supprimer » un conteneur resté. */
  @Delete('leftovers/:name')
  async removeLeftover(@Param('name') name: string): Promise<ContainersDto> {
    const view = await guard(this.containers.removeLeftovers(name));
    return presentContainers(view);
  }
}
