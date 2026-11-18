import { BadRequestException, Body, Controller, Delete, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import type { IsolationDto } from '@bosco/domain';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import {
  InvalidIsolation,
  type IsolationService,
  type IsolationSnapshot,
} from '../../application/isolation.service.ts';
import { AGENT_IMAGE, AGENT_LIMITS } from '../../infrastructure/docker/docker-isolation.ts';
import { ISOLATION_SERVICE } from '../../tokens.ts';

const domainSchema = z.object({ domain: z.string().max(253) });
const subscriptionSchema = z.object({ profile: z.string().max(4096).nullable() }).strict();

function present(snapshot: IsolationSnapshot): IsolationDto {
  return {
    domains: { added: snapshot.added, locked: snapshot.locked },
    image: AGENT_IMAGE,
    limits: { ...AGENT_LIMITS },
    subscription: snapshot.subscription,
  };
}

async function settle(change: Promise<IsolationSnapshot>): Promise<IsolationDto> {
  try {
    const snapshot = await change;
    return present(snapshot);
  } catch (error) {
    if (error instanceof InvalidIsolation) throw new BadRequestException({ message: error.message });
    throw error;
  }
}

/** Isolation des bacs à sable et abonnement Claude par défaut, réservés au poste : le téléphone les lit. */
@Controller('api/isolation')
export class IsolationController {
  constructor(@Inject(ISOLATION_SERVICE) private readonly isolation: IsolationService) {}

  @Get()
  async snapshot(): Promise<IsolationDto> {
    const snapshot = await this.isolation.snapshot();
    return present(snapshot);
  }

  /** Ajout d'un domaine : vaut sans relancer les bacs à sable. */
  @Post('domains')
  addDomain(@Body() body: unknown): Promise<IsolationDto> {
    return settle(this.isolation.addDomain(parseBody(domainSchema, body).domain));
  }

  @Delete('domains/:domain')
  removeDomain(@Param('domain') domain: string): Promise<IsolationDto> {
    return settle(this.isolation.removeDomain(domain));
  }

  /** Abonnement Claude par défaut : celui que prend une nouvelle session qui n'en choisit pas d'autre. */
  @Put('subscription')
  setSubscription(@Body() body: unknown): Promise<IsolationDto> {
    return settle(this.isolation.setSubscription(parseBody(subscriptionSchema, body).profile));
  }
}
