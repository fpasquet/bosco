import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import type { PilotOptionsDto, SuggestionDto } from '@bosco/domain';
import type { LiveSignalService } from '../../application/live-signal.service.ts';
import type { PilotService } from '../../application/pilot.service.ts';
import type { SuggestionService } from '../../application/suggestion.service.ts';
import { DomainError } from '../../../shared/domain/domain-error.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { PermissionAlreadySettled } from '../../application/live-signal.service.ts';
import {
  EFFORTS,
  InvalidAnswers,
  InvalidPilotMessage,
  MAX_IMAGES,
  PERMISSION_MODES,
  PilotTargetNotFound,
} from '../../domain/pilot.ts';
import { LIVE_SIGNAL_SERVICE, PILOT_SERVICE, SUGGESTION_SERVICE } from '../../tokens.ts';

const settingsSchema = z.object({
  effort: z.enum(EFFORTS as [string, ...string[]]).nullable(),
  model: z.string().trim().min(1).max(100).nullable(),
  permissionMode: z.enum(PERMISSION_MODES as [string, ...string[]]),
});

/** Message à une session pilotée (CA-SESS-92) : texte, images en base64, réglages du tour (CA-SESS-94). */
const messageSchema = z.object({
  images: z
    .array(z.object({ data: z.string().min(1), mediaType: z.string().min(1), name: z.string().min(1).max(200) }))
    .max(MAX_IMAGES),
  settings: settingsSchema,
  text: z.string().max(100_000),
});

const startSchema = messageSchema.extend({
  profile: z.string().min(1).nullable(),
  repository: z.string().min(1),
});

/** Réponses à une question de l'agent : une liste de choix par question, ou null pour « Passer » (CA-SESS-96). */
const answersSchema = z.object({
  answers: z.array(z.array(z.string().max(2000))).nullable(),
  requestId: z.string().min(1),
});

type Message = z.infer<typeof messageSchema>;

function pilotMessage(body: Message) {
  return {
    message: { images: body.images, text: body.text },
    settings: body.settings as Parameters<PilotService['send']>[1]['settings'],
  };
}

/** Erreurs du pilotage traduites en codes stables pour l'interface. */
function translate(error: unknown): never {
  if (error instanceof InvalidPilotMessage || error instanceof InvalidAnswers)
    throw new BadRequestException({ code: error.code, message: error.message });
  if (error instanceof PilotTargetNotFound) throw new NotFoundException({ code: error.code, message: error.message });
  if (error instanceof PermissionAlreadySettled) throw new ConflictException({ code: 'questionAlreadyAnswered' });
  if (error instanceof DomainError) throw new ConflictException({ code: error.code, message: error.message });
  throw error;
}

/**
 * Sessions pilotées par Bosco (E2e à E2h, E16a) : démarrer, écrire, mettre en attente, arrêter, répondre aux questions
 * de l'agent ; le téléphone y a accès comme le poste (CA-SESS-100).
 */
@Controller('api')
export class PilotController {
  constructor(
    @Inject(PILOT_SERVICE) private readonly pilot: PilotService,
    @Inject(LIVE_SIGNAL_SERVICE) private readonly liveSignals: LiveSignalService,
    @Inject(SUGGESTION_SERVICE) private readonly suggestions: SuggestionService,
  ) {}

  /** Formulaire d'une nouvelle session (E16a) : dépôts et abonnements Claude. */
  @Get('pilot/options')
  async options(): Promise<PilotOptionsDto> {
    return this.pilot.options();
  }

  /** « Démarrer la session » (CA-SESS-91). */
  @Post('pilot/sessions')
  async start(@Body() body: unknown): Promise<{ sessionId: string }> {
    const input = parseBody(startSchema, body);
    try {
      const sessionId = await this.pilot.start({
        ...pilotMessage(input),
        profile: input.profile,
        repository: input.repository,
      });
      return { sessionId };
    } catch (error) {
      translate(error);
    }
  }

  /** Un message à une session : il lance un tour, ou attend la fin du tour en cours (CA-SESS-92, CA-SESS-93). */
  @Post('sessions/:id/messages')
  async send(@Param('id') id: string, @Body() body: unknown): Promise<{ status: 'channel' | 'queued' | 'sent' }> {
    const input = parseBody(messageSchema, body);
    try {
      const status = await this.pilot.send(id, pilotMessage(input));
      return { status };
    } catch (error) {
      translate(error);
    }
  }

  /** « Annuler » le message en attente (CA-SESS-93). */
  @Delete('sessions/:id/messages/pending')
  @HttpCode(204)
  async cancelPending(@Param('id') id: string): Promise<void> {
    try {
      await this.pilot.cancelPending(id);
    } catch (error) {
      translate(error);
    }
  }

  /** « Arrêter » le tour (CA-SESS-93). */
  @Post('sessions/:id/interrupt')
  @HttpCode(204)
  interrupt(@Param('id') id: string): void {
    try {
      this.pilot.interrupt(id);
    } catch (error) {
      translate(error);
    }
  }

  /** Réponse à une question de l'agent, ou « Passer » (CA-SESS-96). */
  @Post('sessions/:id/answers')
  @HttpCode(204)
  async answer(@Param('id') id: string, @Body() body: unknown): Promise<void> {
    const { answers, requestId } = parseBody(answersSchema, body);
    try {
      await this.liveSignals.answerQuestion(id, requestId, answers);
    } catch (error) {
      translate(error);
    }
  }

  /** Suggestions de l'éditeur (CA-SESS-99) : `@` les fichiers, `/` les commandes, pour une session ou un dépôt. */
  @Get('pilot/suggestions')
  async suggest(
    @Query('kind') kind: string,
    @Query('q') query = '',
    @Query('session') sessionId?: string,
    @Query('repository') repository?: string,
    @Query('profile') profile?: string,
  ): Promise<{ suggestions: SuggestionDto[] }> {
    if (kind !== 'file' && kind !== 'command') throw new BadRequestException({ code: 'invalidRequest' });
    if (!sessionId && !repository) throw new BadRequestException({ code: 'invalidRequest' });
    const target = sessionId ? { sessionId } : { repository: repository ?? '', profile: profile ?? null };
    try {
      const suggestions = await this.suggestions.suggest(kind, target, query.slice(0, 200));
      return { suggestions };
    } catch (error) {
      translate(error);
    }
  }
}
