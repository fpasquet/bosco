import { BadRequestException, Body, Controller, Delete, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { freemem } from 'node:os';
import { z } from 'zod';
import type { IsolationDto } from '@bosco/domain';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import {
  AGENTS,
  InvalidIsolation,
  type IsolationService,
  type IsolationSnapshot,
} from '../../application/isolation.service.ts';
import { AGENT_LIMITS, RESERVED_MEMORY } from '../../application/worker.service.ts';
import { AGENT_IMAGE } from '../../infrastructure/worker/docker-agent-runner.ts';
import { ISOLATION_SERVICE } from '../../tokens.ts';

const domainSchema = z.object({ domain: z.string().max(253) });
const capacitySchema = z.object({ maxAgents: z.number().int() });

function present(snapshot: IsolationSnapshot): IsolationDto {
  return {
    limits: { ...AGENT_LIMITS },
    capacity: {
      maxAgents: snapshot.maxAgents,
      maxAgentsRange: [AGENTS.min, AGENTS.max],
      reservedMemory: RESERVED_MEMORY,
      freeMemory: freemem(),
    },
    image: AGENT_IMAGE,
    domains: { locked: snapshot.locked, added: snapshot.added },
    refusals: snapshot.refusals.map(({ at, host, taskId }) => ({ at: at.toISOString(), host, taskId })),
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

/** Réglages de l'isolation du worker (E11a, E11b), réservés au poste : le téléphone les lit seulement. */
@Controller('api/isolation')
export class IsolationController {
  constructor(@Inject(ISOLATION_SERVICE) private readonly isolation: IsolationService) {}

  @Get()
  async overview(): Promise<IsolationDto> {
    const snapshot = await this.isolation.snapshot();
    return present(snapshot);
  }

  @Put('capacity')
  capacity(@Body() body: unknown): Promise<IsolationDto> {
    return settle(this.isolation.setMaxAgents(parseBody(capacitySchema, body).maxAgents));
  }

  /** Ajout d'un domaine, ou « Autoriser ce domaine » d'un refus : vaut sans relancer la tâche (CA-CONT). */
  @Post('domains')
  add(@Body() body: unknown): Promise<IsolationDto> {
    return settle(this.isolation.addDomain(parseBody(domainSchema, body).domain));
  }

  @Delete('domains/:domain')
  remove(@Param('domain') domain: string): Promise<IsolationDto> {
    return settle(this.isolation.removeDomain(domain));
  }
}
