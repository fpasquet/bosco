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
import type { ArchitectureDto, ContextDto, ContextPreviewDto, DecisionDetailDto, DecisionDto } from '@bosco/domain';
import type { DecisionSnapshot } from '../../domain/decision.ts';
import { DomainError } from '../../../shared/domain/domain-error.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { type ContextService, UnknownDecision } from '../../application/context.service.ts';
import { CONTEXT_SERVICE } from '../../tokens.ts';

const textSchema = z.object({
  title: z.string().max(300),
  context: z.string().max(10_000),
  decision: z.string().max(10_000),
  consequences: z.string().max(10_000).nullable().default(null),
  alternatives: z.string().max(10_000).nullable().default(null),
});
const targetSchema = z.object({ kind: z.literal('project'), name: z.string().min(1) });
const writeSchema = z.object({
  target: targetSchema,
  text: textSchema,
  accept: z.boolean(),
  replaces: z.number().int().nullable().default(null),
});
const acceptSchema = z.object({ edited: textSchema.nullable().default(null) });
const reasonSchema = z.object({ reason: z.string().max(2000).nullable().default(null) });
const versionSchema = z.object({ text: textSchema, note: z.string().max(500) });
const architectureSchema = z.object({
  calls: z.array(z.string().max(200)).max(50),
  calledBy: z.array(z.string().max(200)).max(50),
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

/** Contexte des agents, réservé à toi : le téléphone lit, accepte ou refuse seulement. */
@Controller('api')
export class ContextController {
  constructor(@Inject(CONTEXT_SERVICE) private readonly context: ContextService) {}

  @Get('context')
  async overview(@Query('project') project: string): Promise<ContextDto> {
    const overview = await this.context.overview(project);
    return {
      project: overview.project,
      architecture: overview.architecture,
      decisions: overview.decisions.map(present),
      proposed: overview.proposed.map(present),
      groups: overview.groups,
    };
  }

  @Get('context/preview')
  async preview(@Query('project') project: string): Promise<ContextPreviewDto> {
    const preview = await this.context.preview(project);
    return {
      text: preview.text,
      tokens: preview.tokens,
      at: preview.at.toISOString(),
      absent: { proposed: preview.absent.proposed.map(present) },
    };
  }

  /** Décisions proposées, tous projets : le compteur de l'entrée « Contexte » (CA-CONT-03). */
  @Get('context/proposals')
  async proposals(): Promise<{ proposals: DecisionDto[] }> {
    const proposals = await this.context.proposals();
    return { proposals: proposals.map(present) };
  }

  @Put('context/architecture/:project')
  architecture(@Param('project') project: string, @Body() body: unknown): Promise<ArchitectureDto> {
    return this.context.setArchitecture(project, parseBody(architectureSchema, body));
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
    const { accept, replaces, target, text } = parseBody(writeSchema, body);
    const decision = await settle(() => this.context.write(target, text, { accept, replaces }));
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
}
