import { BadRequestException, Body, Controller, Get, Inject, Param, Put, Query } from '@nestjs/common';
import { z } from 'zod';
import type { RightsDto } from '@bosco/domain';
import type { AccountsService } from '../../application/accounts.service.ts';
import type { TaskService } from '../../application/task.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { InvalidAccounts } from '../../application/accounts.service.ts';
import { InvalidRights, type RightsService, type RightsView } from '../../application/rights.service.ts';
import { MODELS } from '../../domain/rights.ts';
import { ACCOUNTS_SERVICE, RIGHTS_SERVICE, TASK_SERVICE } from '../../tokens.ts';

const tools = z.array(z.string().max(220)).max(50);
const changesSchema = z
  .object({
    concurrency: z.number().nullable(),
    deniedTools: tools.nullable(),
    maxBudgetUsd: z.number().nullable(),
    maxTurns: z.number().nullable(),
    model: z.string().nullable(),
    pullRequest: z.enum(['always', 'ask', 'never']).nullable(),
    tools: tools.nullable(),
  })
  .partial()
  .strict();

const accountsSchema = z
  .object({ claudeProfile: z.string().max(4096).nullable(), githubAccount: z.string().max(100).nullable() })
  .partial()
  .strict();

const NOT_STARTED = new Set(['awaiting_session', 'blocked', 'queued']);

/** Droits des agents (E8a), réservés au poste : le téléphone les lit seulement. */
@Controller('api/rights')
export class RightsController {
  constructor(
    @Inject(RIGHTS_SERVICE) private readonly rights: RightsService,
    @Inject(TASK_SERVICE) private readonly tasks: TaskService,
    @Inject(ACCOUNTS_SERVICE) private readonly accounts: AccountsService,
  ) {}

  @Get()
  async show(@Query('repository') repository?: string): Promise<RightsDto> {
    const view = await this.rights.view(repository || null);
    return this.present(view, repository || null);
  }

  @Put('general')
  async general(@Body() body: unknown): Promise<RightsDto> {
    const view = await this.settle(this.rights.updateGeneral(parseBody(changesSchema, body)));
    return this.present(view, null);
  }

  @Put('repositories/:name')
  async repository(@Param('name') name: string, @Body() body: unknown): Promise<RightsDto> {
    const view = await this.settle(this.rights.updateRepository(name, parseBody(changesSchema, body)));
    return this.present(view, name);
  }

  /** Abonnement Claude et compte GitHub propres au dépôt (E8a) ; null revient à ceux par défaut. */
  @Put('repositories/:name/accounts')
  async repositoryAccounts(@Param('name') name: string, @Body() body: unknown): Promise<RightsDto> {
    try {
      await this.accounts.update(name, parseBody(accountsSchema, body));
    } catch (error) {
      if (error instanceof InvalidAccounts) throw new BadRequestException({ message: error.message });
      throw error;
    }
    const view = await this.rights.view(name);
    return this.present(view, name);
  }

  private async settle(change: Promise<RightsView>): Promise<RightsView> {
    try {
      const view = await change;
      return view;
    } catch (error) {
      if (error instanceof InvalidRights) throw new BadRequestException({ message: error.message });
      throw error;
    }
  }

  private async present(view: RightsView, repository: null | string): Promise<RightsDto> {
    const tasks = repository ? await this.tasks.list() : [];
    const accounts = await this.accounts.view(repository);
    return {
      ...view,
      accounts,
      models: [...MODELS],
      pending: tasks
        .filter((task) => task.repository.name === repository && NOT_STARTED.has(task.state))
        .map(({ id, state, title }) => ({ id, state, title })),
    };
  }
}
