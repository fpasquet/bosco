import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  type MessageEvent,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Sse,
} from '@nestjs/common';
import { concatWith, defer, from, map, type Observable } from 'rxjs';
import { z } from 'zod';
import type { RepositoryCatalog } from '../../application/ports.ts';
import type { TaskEventsBus } from '../../infrastructure/task-events.bus.ts';
import { DomainError } from '../../../shared/domain/domain-error.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import {
  InvalidTask,
  type TaskDraft,
  type TaskService,
  type TaskView,
  UnknownTask,
} from '../../application/task.service.ts';
import { REPOSITORY_CATALOG, TASK_EVENTS, TASK_SERVICE } from '../../tokens.ts';
import { presentTask, type TaskDto } from './task.presenter.ts';

const draftSchema = z.object({
  repository: z.string(),
  folder: z.string().default(''),
  instruction: z.string(),
  mode: z.enum(['session', 'worker']),
  prerequisites: z.array(z.number().int().positive()).default([]),
  context: z.string().trim().max(500).nullish(),
  guardrails: z.object({
    budgetUsd: z.number(),
    maxTurns: z.number().int(),
    model: z.string().nullish(),
    tools: z.array(z.string()).nullish(),
  }),
});

const relaunchSchema = z.object({
  budgetUsd: z.number().positive(),
  fromBranch: z.boolean(),
  instruction: z.string().max(5000).optional(),
});

const rejectSchema = z.object({ reason: z.string().trim().max(2000).nullish() });

function draftOf(body: unknown): TaskDraft {
  const draft = parseBody(draftSchema, body);
  return {
    ...draft,
    context: draft.context || null,
    guardrails: { ...draft.guardrails, model: draft.guardrails.model ?? null, tools: draft.guardrails.tools ?? null },
  };
}

/** Traduit les erreurs du domaine : 400 avec les champs en cause (E6b), 404, 409. */
async function guard<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof InvalidTask) throw new BadRequestException({ code: error.code, issues: error.issues });
    if (error instanceof UnknownTask) throw new NotFoundException({ code: error.code });
    if (error instanceof DomainError) throw new ConflictException({ code: error.code, message: error.message });
    throw error;
  }
}

async function guardTask(work: () => Promise<TaskView>): Promise<TaskDto> {
  const task = await guard(work);
  return presentTask(task);
}

/** Tâches confiées à Claude Code (E5, E6, E13). */
@Controller('api')
export class TasksController {
  constructor(
    @Inject(TASK_SERVICE) private readonly tasks: TaskService,
    @Inject(TASK_EVENTS) private readonly bus: TaskEventsBus,
    @Inject(REPOSITORY_CATALOG) private readonly catalog: RepositoryCatalog,
  ) {}

  /** Dépôts où une tâche peut se créer : ceux des sessions des profils surveillés (E6a). */
  @Get('repositories')
  async repositories(): Promise<{ repositories: { name: string; root: string }[] }> {
    const repositories = await this.catalog.list();
    return { repositories };
  }

  @Get('tasks')
  async list(): Promise<{ tasks: TaskDto[] }> {
    const tasks = await this.tasks.list();
    return { tasks: tasks.map(presentTask) };
  }

  /** Flux en direct des tâches : toutes les tâches, puis chaque changement (DT-06). */
  @Sse('tasks/events')
  events(): Observable<MessageEvent> {
    return defer(() =>
      from(this.tasks.list()).pipe(
        map((tasks) => ({ type: 'tasks.snapshot', data: { tasks: tasks.map(presentTask) } })),
        concatWith(this.bus.changes.pipe(map((task) => ({ type: 'task.updated', data: { task: presentTask(task) } })))),
      ),
    );
  }

  @Get('tasks/:id')
  async get(@Param('id', ParseIntPipe) id: number): Promise<TaskDto> {
    return guardTask(() => this.tasks.get(id));
  }

  /** Tâches qui échoueraient avec une annulation : la confirmation les nomme (E13c). */
  @Get('tasks/:id/cancellation')
  async cancellation(@Param('id', ParseIntPipe) id: number): Promise<{ failing: TaskDto[] }> {
    const failing = await guard(() => this.tasks.cancellationImpact(id));
    return { failing: failing.map(presentTask) };
  }

  @Post('tasks')
  async create(@Body() body: unknown): Promise<TaskDto> {
    const draft = draftOf(body);
    return guardTask(() => this.tasks.create(draft));
  }

  @Put('tasks/:id')
  async edit(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<TaskDto> {
    const draft = draftOf(body);
    return guardTask(() => this.tasks.edit(id, draft));
  }

  @Post('tasks/:id/cancel')
  async cancel(@Param('id', ParseIntPipe) id: number): Promise<TaskDto> {
    return guardTask(() => this.tasks.cancel(id));
  }

  @Post('tasks/:id/relaunch')
  async relaunch(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<TaskDto> {
    const changes = parseBody(relaunchSchema, body);
    return guardTask(() => this.tasks.relaunch(id, changes));
  }

  @Post('tasks/:id/validate')
  async validate(@Param('id', ParseIntPipe) id: number): Promise<TaskDto> {
    return guardTask(() => this.tasks.validate(id));
  }

  @Post('tasks/:id/reject')
  async reject(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<TaskDto> {
    const { reason } = parseBody(rejectSchema, body ?? {});
    return guardTask(() => this.tasks.reject(id, reason ?? null));
  }
}
