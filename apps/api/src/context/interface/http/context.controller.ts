import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import type {
  ArchitectureDto,
  ContextDto,
  ContextPreviewDto,
  DecisionDetailDto,
  DecisionDto,
  SocleDto,
} from '@bosco/domain';
import type { LinksService } from '../../application/links.service.ts';
import type { DecisionSnapshot } from '../../domain/decision.ts';
import { DomainError } from '../../../shared/domain/domain-error.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { type ContextService, UnknownDecision } from '../../application/context.service.ts';
import { CONTEXT_SERVICE, LINKS_SERVICE } from '../../tokens.ts';

const textSchema = z.object({
  title: z.string().max(300),
  context: z.string().max(10_000),
  decision: z.string().max(10_000),
  consequences: z.string().max(10_000).nullable().default(null),
  alternatives: z.string().max(10_000).nullable().default(null),
});
const targetSchema = z.union([
  z.object({ kind: z.literal('repository'), name: z.string().min(1) }),
  z.object({ kind: z.literal('socle'), id: z.number().int() }),
]);
const writeSchema = z.object({
  target: targetSchema,
  text: textSchema,
  accept: z.boolean(),
  exceptionTo: z.number().int().nullable().default(null),
  replaces: z.number().int().nullable().default(null),
});
const acceptSchema = z.object({ edited: textSchema.nullable().default(null) });
const reasonSchema = z.object({ reason: z.string().max(2000).nullable().default(null) });
const versionSchema = z.object({ text: textSchema, note: z.string().max(500) });
const architectureSchema = z.object({
  calls: z.array(z.string().max(200)).max(50),
  calledBy: z.array(z.string().max(200)).max(50),
});
const socleSchema = z.object({
  name: z.string().max(200),
  scope: z.enum(['global', 'shared']),
  inherits: z.number().int().nullable().default(null),
  repositories: z.array(z.string()).max(500).default([]),
});

function present(decision: DecisionSnapshot): DecisionDto {
  return { ...decision, versions: decision.versions.map((version) => ({ ...version, at: version.at.toISOString() })) };
}

/** Erreurs du domaine en 400 avec leur message, décision inconnue en 404. */
async function settle<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof UnknownDecision) throw new NotFoundException();
    if (error instanceof DomainError) throw new BadRequestException({ code: error.code, message: error.message });
    throw error;
  }
}

/** Contexte des agents (E9, E14), réservé à toi : le téléphone lit, accepte ou refuse seulement. */
@Controller('api')
export class ContextController {
  constructor(
    @Inject(CONTEXT_SERVICE) private readonly context: ContextService,
    @Inject(LINKS_SERVICE) private readonly links: LinksService,
  ) {}

  @Get('context')
  async overview(@Query('repository') repository: string): Promise<ContextDto> {
    const overview = await this.context.overview(repository);
    return {
      repository: overview.repository,
      architecture: overview.architecture,
      decisions: overview.decisions.map(present),
      proposed: overview.proposed.map(present),
      excluded: overview.excluded.map(present),
      socles: overview.socles.map(({ decisions, socle }) => ({
        socle: { id: socle.id, name: socle.name, scope: socle.scope },
        decisions: decisions.map(present),
      })),
    };
  }

  @Get('context/preview')
  async preview(@Query('repository') repository: string, @Query('task') task?: string): Promise<ContextPreviewDto> {
    // Pour une tâche choisie, ses liens comptent aussi (E9f, annotation 3)
    const links = task ? await this.links.contextLinks(Number(task)) : [];
    const preview = await this.context.preview(repository, links);
    return {
      text: preview.text,
      tokens: preview.tokens,
      at: preview.at.toISOString(),
      absent: { proposed: preview.absent.proposed.map(present), excluded: preview.absent.excluded.map(present) },
    };
  }

  /** Décisions proposées, tous dépôts : le compteur de l'entrée « Contexte » (CA-CONT-03). */
  @Get('context/proposals')
  async proposals(): Promise<{ proposals: DecisionDto[] }> {
    const proposals = await this.context.proposals();
    return { proposals: proposals.map(present) };
  }

  @Put('context/architecture/:repository')
  architecture(@Param('repository') repository: string, @Body() body: unknown): Promise<ArchitectureDto> {
    return this.context.setArchitecture(repository, parseBody(architectureSchema, body));
  }

  @Get('decisions/:id')
  async decision(@Param('id', ParseIntPipe) id: number): Promise<DecisionDetailDto> {
    const detail = await settle(() => this.context.decision(id));
    return {
      decision: present(detail.decision),
      replacedBy: detail.replacedBy && present(detail.replacedBy),
      specifiedBy: detail.specifiedBy.map(present),
    };
  }

  @Post('decisions')
  async write(@Body() body: unknown): Promise<DecisionDto> {
    const { accept, exceptionTo, replaces, target, text } = parseBody(writeSchema, body);
    const decision = await settle(() => this.context.write(target, text, { accept, exceptionTo, replaces }));
    return present(decision);
  }

  @Post('decisions/:id/accept')
  async accept(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<DecisionDto> {
    const { edited } = parseBody(acceptSchema, body ?? {});
    const decision = await settle(() => this.context.accept(id, edited));
    return present(decision);
  }

  @Post('decisions/:id/refuse')
  async refuse(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<DecisionDto> {
    const { reason } = parseBody(reasonSchema, body ?? {});
    const decision = await settle(() => this.context.refuse(id, reason));
    return present(decision);
  }

  @Post('decisions/:id/versions')
  async edit(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<DecisionDto> {
    const { note, text } = parseBody(versionSchema, body);
    const decision = await settle(() => this.context.edit(id, text, note));
    return present(decision);
  }

  @Post('decisions/:id/abandon')
  async abandon(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<DecisionDto> {
    const { reason } = parseBody(reasonSchema, body ?? {});
    const decision = await settle(() => this.context.abandon(id, reason));
    return present(decision);
  }

  @Get('socles')
  async socles(): Promise<{ socles: SocleDto[] }> {
    const socles = await this.context.listSocles();
    return {
      socles: socles.map((socle) => ({
        ...socle,
        decisions: socle.decisions.map(present),
        exceptions: socle.exceptions.map((exception) => ({
          repository: exception.repository,
          decision: present(exception.decision),
          replaces: present(exception.replaces),
        })),
      })),
    };
  }

  @Post('socles')
  createSocle(@Body() body: unknown) {
    const socle = parseBody(socleSchema, body);
    return settle(() => this.context.saveSocle({ ...socle, id: null }));
  }

  @Put('socles/:id')
  updateSocle(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const socle = parseBody(socleSchema, body);
    return settle(() => this.context.saveSocle({ ...socle, id }));
  }
}
