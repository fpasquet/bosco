import { BadRequestException, Body, Controller, Get, Inject, NotFoundException, Param, Put } from '@nestjs/common';
import { z } from 'zod';
import type { TestEnvironmentDto } from '@bosco/domain';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import {
  type EnvironmentView,
  InvalidEnvironment,
  type TestEnvironmentService,
  UnknownRepository,
} from '../../application/test-environment.service.ts';
import { SERVICE_LIMITS } from '../../domain/test-services.ts';
import { AGENT_IMAGE } from '../../infrastructure/worker/docker-agent-runner.ts';
import { TEST_ENVIRONMENT_SERVICE } from '../../tokens.ts';

const changesSchema = z.object({
  mode: z.enum(['auto', 'choose', 'none']).optional(),
  selected: z.array(z.string().max(200)).max(100).optional(),
  image: z.string().max(300).nullable().optional(),
});

function present(view: EnvironmentView): TestEnvironmentDto {
  return {
    repository: view.repository,
    branch: view.branch,
    file: view.file,
    mode: view.environment.mode,
    selected: view.environment.selected,
    image: view.environment.image,
    defaultImage: AGENT_IMAGE,
    services: view.services.map(({ image, name }) => ({ name, image })),
    launched: view.launched.map(({ image, name }) => ({ name, image: image ?? '' })),
    excluded: view.excluded,
    removed: view.removed,
    limits: { ...SERVICE_LIMITS },
    lastRun: view.lastRun && {
      taskId: view.lastRun.taskId,
      at: view.lastRun.at.toISOString(),
      removedAt: view.lastRun.removedAt?.toISOString() ?? null,
      launches: view.lastRun.launches,
    },
  };
}

async function settle(view: Promise<EnvironmentView>): Promise<TestEnvironmentDto> {
  try {
    const resolved = await view;
    return present(resolved);
  } catch (error) {
    if (error instanceof UnknownRepository) throw new NotFoundException();
    if (error instanceof InvalidEnvironment) throw new BadRequestException({ message: error.message });
    throw error;
  }
}

/** Environnement de test d'un dépôt (E12a), réservé au poste : le téléphone le lit seulement. */
@Controller('api/repositories/:name/test-environment')
export class TestEnvironmentController {
  constructor(@Inject(TEST_ENVIRONMENT_SERVICE) private readonly environments: TestEnvironmentService) {}

  @Get()
  show(@Param('name') name: string): Promise<TestEnvironmentDto> {
    return settle(this.environments.view(name));
  }

  @Put()
  update(@Param('name') name: string, @Body() body: unknown): Promise<TestEnvironmentDto> {
    return settle(this.environments.update(name, parseBody(changesSchema, body)));
  }
}
