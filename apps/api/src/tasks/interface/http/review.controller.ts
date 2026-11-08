import { BadRequestException, Body, Controller, Get, Inject, Param, ParseIntPipe, Post } from '@nestjs/common';
import { z } from 'zod';
import type { TaskChangesDto, TaskReviewDto, ValidationDto } from '@bosco/domain';
import type { TaskService } from '../../application/task.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { pullRequestBody, ReviewError, type ReviewService, type Validation } from '../../application/review.service.ts';
import { REVIEW_SERVICE, TASK_SERVICE } from '../../tokens.ts';
import { presentTask } from './task.presenter.ts';
import { guard } from './tasks.controller.ts';

const pullRequestSchema = z.object({ title: z.string().trim().min(1).max(300), body: z.string().max(20_000) });
const validateSchema = z.object({ pullRequest: pullRequestSchema.nullable().default(null) });
const rejectSchema = z.object({ reason: z.string().max(2000), relaunch: z.boolean() });

/** Une relecture refusée (motif vide, pas de branche) est une erreur de saisie : 400 ; le reste suit les tâches. */
function settle<T>(work: () => Promise<T>): Promise<T> {
  return guard(async () => {
    try {
      return await work();
    } catch (error) {
      if (error instanceof ReviewError) throw new BadRequestException({ message: error.message });
      throw error;
    }
  });
}

function present({ pullRequestError, task }: Validation): ValidationDto {
  return { task: presentTask(task), pullRequestError };
}

/** Relecture d'une tâche du worker (E7a, E7b, E7c). */
@Controller('api/tasks/:id')
export class ReviewController {
  constructor(
    @Inject(REVIEW_SERVICE) private readonly review: ReviewService,
    @Inject(TASK_SERVICE) private readonly tasks: TaskService,
  ) {}

  @Get('changes')
  changes(@Param('id', ParseIntPipe) id: number): Promise<TaskChangesDto> {
    return settle(() => this.review.changesOf(id));
  }

  @Get('review')
  async info(@Param('id', ParseIntPipe) id: number): Promise<TaskReviewDto> {
    const info = await settle(() => this.review.info(id));
    const task = await this.tasks.get(id);
    return { ...info, proposal: { title: task.title, body: pullRequestBody(task) } };
  }

  /** Valider, avec une PR brouillon si le dépôt le demande ; un envoi en échec laisse la tâche validée. */
  @Post('validate')
  async validate(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<ValidationDto> {
    const { pullRequest } = parseBody(validateSchema, body ?? {});
    const validation = await settle(() => this.review.validate(id, pullRequest));
    return present(validation);
  }

  /** « Réessayer » après un envoi en échec. */
  @Post('pull-request')
  async pullRequest(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<ValidationDto> {
    const request = parseBody(pullRequestSchema, body);
    const validation = await settle(() => this.review.retryPullRequest(id, request));
    return present(validation);
  }

  @Post('reject')
  reject(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const { reason, relaunch } = parseBody(rejectSchema, body);
    return settle(async () => {
      const task = await this.review.reject(id, reason, relaunch);
      return presentTask(task);
    });
  }
}
