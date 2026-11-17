import { BadRequestException, Body, Controller, Get, Inject, Put } from '@nestjs/common';
import { z } from 'zod';
import type { QuotaDto } from '@bosco/domain';
import type { IsolationService } from '../../application/isolation.service.ts';
import type { QuotaService, QuotaUsage } from '../../application/quota.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { InvalidQuota } from '../../domain/quota.ts';
import { ISOLATION_SERVICE, QUOTA_SERVICE } from '../../tokens.ts';

const windowSchema = z.object({ stop: z.number().int(), wait: z.number().int() });
const thresholdsSchema = z.object({ fiveHour: windowSchema, sevenDay: windowSchema });
const scopeSchema = z.object({ scope: z.enum(['all', 'sandbox']) });

function window(value: QuotaUsage['fiveHour']) {
  return value ? { resetsAt: value.resetsAt.toISOString(), usage: value.usage } : null;
}

/** Quota de l'abonnement (E11, DT-39) : l'usage de chaque abonnement, les seuils et leur portée, réglés sur le poste. */
@Controller('api/quota')
export class QuotaController {
  constructor(
    @Inject(QUOTA_SERVICE) private readonly quota: QuotaService,
    @Inject(ISOLATION_SERVICE) private readonly isolation: IsolationService,
  ) {}

  @Get()
  async view(): Promise<QuotaDto> {
    const subscriptions = await this.isolation.subscriptions();
    return {
      scope: this.quota.scope(),
      thresholds: this.quota.thresholds(),
      subscriptions: subscriptions.map(({ label, path }) => {
        const usage = this.quota.usage(path);
        return { label, path, fiveHour: window(usage.fiveHour), sevenDay: window(usage.sevenDay) };
      }),
    };
  }

  /** Seuils valables pour toutes les sessions pilotées, dès le prochain tour (CA-CONT-99). */
  @Put('thresholds')
  async setThresholds(@Body() body: unknown): Promise<QuotaDto> {
    const thresholds = parseBody(thresholdsSchema, body);
    try {
      await this.quota.setThresholds(thresholds);
    } catch (error) {
      if (error instanceof InvalidQuota) throw new BadRequestException({ code: error.code, message: error.message });
      throw error;
    }
    return this.view();
  }

  /** Sessions retenues par les seuils : en bac à sable seulement, ou aussi pilotées sur le poste. */
  @Put('scope')
  async setScope(@Body() body: unknown): Promise<QuotaDto> {
    const { scope } = parseBody(scopeSchema, body);
    await this.quota.setScope(scope);
    return this.view();
  }
}
