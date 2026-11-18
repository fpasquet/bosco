import { Controller, Get, Inject, Query } from '@nestjs/common';
import { z } from 'zod';
import type { UsageReportDto } from '@bosco/domain';
import type { UsageFilters, UsageService } from '../../application/usage.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { USAGE_SERVICE } from '../../tokens.ts';

const filtersSchema = z.object({
  period: z.enum(['7', '30', '90', 'all']).default('30'),
  profile: z.string().min(1).optional(),
  project: z.coerce.number().int().positive().optional(),
  group: z.coerce.number().int().positive().optional(),
  model: z.string().min(1).optional(),
});

function filtersOf(query: unknown): UsageFilters {
  const { group, model, period, profile, project } = parseBody(filtersSchema, query);
  return {
    days: period === 'all' ? null : Number(period),
    sourceId: profile ?? null,
    // Un projet choisi l'emporte sur un groupe : la page ne porte que sur lui
    projectId: project ?? null,
    groupId: project ? null : (group ?? null),
    model: model ?? null,
  };
}

/** Page Usage : les mêmes filtres pour toute la page, sauf le quota, lu par abonnement. */
@Controller('api/usage')
export class UsageController {
  constructor(@Inject(USAGE_SERVICE) private readonly usage: UsageService) {}

  @Get()
  usageReport(@Query() query: unknown): Promise<UsageReportDto> {
    return this.usage.usageReport(filtersOf(query));
  }
}
