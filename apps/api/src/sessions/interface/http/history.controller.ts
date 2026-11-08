import { Controller, Get, Inject, Query } from '@nestjs/common';
import { z } from 'zod';
import type { CostReportDto, HistoryDayDto } from '@bosco/domain';
import type { HistoryFilters, HistoryService } from '../../application/history.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { HISTORY_SERVICE } from '../../tokens.ts';
import { presentSession } from './session.presenter.ts';

const filtersSchema = z.object({
  q: z.string().default(''),
  from: z.iso.date().optional(),
  repo: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  state: z.enum(['ended', 'inactive', 'running', 'waiting']).optional(),
});

function filtersOf(query: unknown): HistoryFilters {
  const { from, q, repo, source, state } = parseBody(filtersSchema, query);
  return {
    query: q,
    from: from ? new Date(`${from}T00:00:00`) : null,
    repository: repo ?? null,
    sourceId: source ?? null,
    state: state ?? null,
  };
}

/** Historique et coûts (E3a, E3b) : les mêmes filtres pour la liste et pour les coûts. */
@Controller('api/history')
export class HistoryController {
  constructor(@Inject(HISTORY_SERVICE) private readonly history: HistoryService) {}

  @Get()
  async days(@Query() query: unknown): Promise<{ days: HistoryDayDto[] }> {
    const days = await this.history.history(filtersOf(query));
    return { days: days.map((day) => ({ ...day, sessions: day.sessions.map(presentSession) })) };
  }

  @Get('costs')
  async costs(@Query() query: unknown): Promise<CostReportDto> {
    return this.history.costs(filtersOf(query));
  }
}
