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
  Put,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import type {
  PilotOptionsDto,
  ProjectCheckoutsDto,
  RetrievedBranchesDto,
  SandboxBranchesDto,
  SandboxRefusalsDto,
  SessionDefaultsResolvedDto,
  SuggestionDto,
} from '@bosco/domain';
import type { SessionDefaults } from '../../../shared/domain/session-settings.ts';
import type { LiveSignalService } from '../../application/live-signal.service.ts';
import type { PilotService } from '../../application/pilot.service.ts';
import type { SessionDefaultsService } from '../../application/session-defaults.service.ts';
import type { SuggestionService } from '../../application/suggestion.service.ts';
import { DomainError } from '../../../shared/domain/domain-error.ts';
import { sessionDefaultsSchema } from '../../../shared/interface/http/defaults-schema.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { PermissionAlreadySettled } from '../../application/live-signal.service.ts';
import { CheckoutError } from '../../domain/checkout.ts';
import {
  EFFORTS,
  InvalidAnswers,
  InvalidPilotMessage,
  MAX_IMAGES,
  MAX_SESSION_PROJECTS,
  PERMISSION_MODES,
  PilotTargetNotFound,
} from '../../domain/pilot.ts';
import { SandboxError } from '../../domain/sandbox.ts';
import { LIVE_SIGNAL_SERVICE, PILOT_SERVICE, SESSION_DEFAULTS_SERVICE, SUGGESTION_SERVICE } from '../../tokens.ts';

const settingsSchema = z.object({
  effort: z.enum(EFFORTS as [string, ...string[]]).nullable(),
  model: z.string().trim().min(1).max(100).nullable(),
  permissionMode: z.enum(PERMISSION_MODES as [string, ...string[]]),
});

/** Message à une session pilotée : texte, images en base64, réglages du tour. */
const messageSchema = z.object({
  images: z
    .array(z.object({ data: z.string().min(1), mediaType: z.string().min(1), name: z.string().min(1).max(200) }))
    .max(MAX_IMAGES),
  settings: settingsSchema,
  text: z.string().max(100_000),
});

const BRANCH = z.string().trim().max(200).nullable();

const startSchema = messageSchema.extend({
  /** Groupe choisi : ses valeurs par défaut passent avant celles du projet principal */
  group: z.number().int().positive().nullish(),
  profile: z.string().min(1).nullable(),
  /** Réglages choisis pour la session ; null : selon les valeurs par défaut */
  settings: sessionDefaultsSchema,
  /** Projet principal, dossier de travail de la session */
  project: z.string().min(1),
  /** Autres projets de la session, qu'elle voit en plus du principal */
  projects: z.array(z.string().min(1)).max(MAX_SESSION_PROJECTS).optional(),
  /** Branche ou worktree choisi pour chaque projet, par racine ; absent : la branche active */
  checkouts: z
    .record(
      z.string().min(1),
      z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('branch'), branch: z.string().trim().min(1).max(200) }),
        z.object({ kind: z.literal('worktree'), path: z.string().min(1).max(4096) }),
      ]),
    )
    .optional(),
  /** Dans un bac à sable : branche de la session, branches de départ, null : proposées */
  sandbox: z
    .object({ branch: BRANCH, startBranch: BRANCH, startBranches: z.record(z.string(), BRANCH).optional() })
    .nullish(),
});

/** Ce qui décide des valeurs d'une nouvelle session : projet principal (sa racine), groupe, profil, bac à sable. */
const defaultsQuery = z.object({
  group: z.coerce.number().int().positive().optional(),
  profile: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  sandbox: z.enum(['true', 'false']).optional(),
});

const checkoutsQuery = z.object({ project: z.string().min(1) });

const retrieveSchema = z.object({ project: z.string().min(1).nullish() }).nullish();

/** Réponses à une question de l'agent : une liste de choix par question, ou null pour « Passer ». */
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
  // Une branche refusée est une erreur de saisie ; un bac à sable indisponible, supprimé ou occupé, un conflit
  if (error instanceof SandboxError && error.code === 'invalidSandboxBranch')
    throw new BadRequestException({ code: error.code, message: error.message });
  if (error instanceof CheckoutError) throw new BadRequestException({ code: error.code, message: error.message });
  if (error instanceof PermissionAlreadySettled) throw new ConflictException({ code: 'questionAlreadyAnswered' });
  if (error instanceof DomainError) throw new ConflictException({ code: error.code, message: error.message });
  throw error;
}

/**
 * Sessions pilotées par Bosco : démarrer, écrire, mettre en attente, arrêter, répondre aux questions
 * de l'agent ; le téléphone y a accès comme le poste.
 */
@Controller('api')
export class PilotController {
  constructor(
    @Inject(PILOT_SERVICE) private readonly pilot: PilotService,
    @Inject(LIVE_SIGNAL_SERVICE) private readonly liveSignals: LiveSignalService,
    @Inject(SUGGESTION_SERVICE) private readonly suggestions: SuggestionService,
    @Inject(SESSION_DEFAULTS_SERVICE) private readonly defaults: SessionDefaultsService,
  ) {}

  /**
   * Valeurs d'une nouvelle session avant tout choix : profil, mode, modèle et effort, chacun
   * avec son origine ; aussi ce dont héritent les réglages d'un projet ou d'un groupe.
   */
  @Get('pilot/defaults')
  async resolveDefaults(@Query() query: unknown): Promise<SessionDefaultsResolvedDto> {
    const input = parseBody(defaultsQuery, query);
    return this.defaults.resolveDefaults({
      group: input.group ?? null,
      profile: input.profile ?? null,
      project: input.project ?? null,
      sandboxed: input.sandbox === 'true',
    });
  }

  /** Formulaire d'une nouvelle session : projets et abonnements Claude. */
  @Get('pilot/options')
  async options(): Promise<PilotOptionsDto> {
    return this.pilot.options();
  }

  /** Branches et worktrees d'un projet (sa racine), proposés au démarrage d'une session. */
  @Get('pilot/checkouts')
  async checkouts(@Query() query: unknown): Promise<ProjectCheckoutsDto> {
    const { project } = parseBody(checkoutsQuery, query);
    try {
      const { active, branches, worktrees } = await this.pilot.checkouts(project);
      return { active, branches, worktrees: worktrees.map(({ branch, path }) => ({ branch, path })) };
    } catch (error) {
      translate(error);
    }
  }

  /** « Démarrer la session ». */
  @Post('pilot/sessions')
  async start(@Body() body: unknown): Promise<{ sessionId: string }> {
    const input = parseBody(startSchema, body);
    try {
      const sessionId = await this.pilot.start({
        message: { images: input.images, text: input.text },
        settings: input.settings as SessionDefaults,
        group: input.group ?? null,
        profile: input.profile,
        project: input.project,
        projects: input.projects ?? [],
        checkouts: input.checkouts ?? {},
        sandbox: input.sandbox ?? null,
      });
      return { sessionId };
    } catch (error) {
      translate(error);
    }
  }

  /**
   * « Récupérer la branche », « Récupérer les branches » : un projet, ou toutes les
   * branches qui ont du travail ; les branches reçues dans les dépôts du poste.
   */
  @Post('sessions/:id/sandbox/retrieve')
  @HttpCode(200)
  async retrieve(@Param('id') id: string, @Body() body: unknown): Promise<RetrievedBranchesDto> {
    const input = parseBody(retrieveSchema, body ?? null);
    try {
      const branches = await this.pilot.retrieve(id, input?.project ?? null);
      return { branch: branches[0]?.branch ?? null, branches };
    } catch (error) {
      translate(error);
    }
  }

  /** Branches du bac à sable, une par projet, avec ce qu'elles contiennent. */
  @Get('sessions/:id/sandbox/branches')
  async branches(@Param('id') id: string): Promise<SandboxBranchesDto> {
    const branches = await this.pilot.branches(id);
    return {
      branches: branches.map(({ files, from, project, retrievedAt }) => ({
        files,
        from,
        project,
        retrievedAt: retrievedAt?.toISOString() ?? null,
      })),
    };
  }

  /** « Arrêter le bac à sable » : le conteneur s'arrête, la copie reste. */
  @Post('sessions/:id/sandbox/stop')
  @HttpCode(204)
  async stopSandbox(@Param('id') id: string): Promise<void> {
    try {
      await this.pilot.stopSandbox(id);
    } catch (error) {
      translate(error);
    }
  }

  /** « Supprimer le bac à sable ». */
  @Delete('sessions/:id/sandbox')
  @HttpCode(204)
  async removeSandbox(@Param('id') id: string): Promise<void> {
    try {
      await this.pilot.removeSandbox(id);
    } catch (error) {
      translate(error);
    }
  }

  /** Sorties réseau refusées du bac à sable. */
  @Get('sessions/:id/sandbox/refusals')
  async refusals(@Param('id') id: string): Promise<SandboxRefusalsDto> {
    const refusals = await this.pilot.refusals(id);
    return { refusals: refusals.map(({ at, host }) => ({ at: at.toISOString(), host })) };
  }

  /** Un message à une session : il lance un tour, ou attend la fin du tour en cours. */
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

  /** Réglages changés dans la barre d'outils : le mode d'autorisations vaut aussi pour le tour en cours. */
  @Put('sessions/:id/settings')
  @HttpCode(204)
  async changeSettings(@Param('id') id: string, @Body() body: unknown): Promise<void> {
    const settings = parseBody(settingsSchema, body);
    try {
      await this.pilot.changeSettings(id, settings as Parameters<PilotService['changeSettings']>[1]);
    } catch (error) {
      translate(error);
    }
  }

  /** « Annuler » le message en attente. */
  @Delete('sessions/:id/messages/pending')
  @HttpCode(204)
  async cancelPending(@Param('id') id: string): Promise<void> {
    try {
      await this.pilot.cancelPending(id);
    } catch (error) {
      translate(error);
    }
  }

  /** « Arrêter » le tour. */
  @Post('sessions/:id/interrupt')
  @HttpCode(204)
  interrupt(@Param('id') id: string): void {
    try {
      this.pilot.interrupt(id);
    } catch (error) {
      translate(error);
    }
  }

  /** Réponse à une question de l'agent, ou « Passer ». */
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

  /** Suggestions de l'éditeur : `@` les fichiers, `/` les commandes, pour une session ou un projet. */
  @Get('pilot/suggestions')
  async suggest(
    @Query('kind') kind: string,
    @Query('q') query = '',
    @Query('session') sessionId?: string,
    @Query('project') project?: string,
    @Query('profile') profile?: string,
  ): Promise<{ suggestions: SuggestionDto[] }> {
    if (kind !== 'file' && kind !== 'command') throw new BadRequestException({ code: 'invalidRequest' });
    if (!sessionId && !project) throw new BadRequestException({ code: 'invalidRequest' });
    const target = sessionId ? { sessionId } : { project: project ?? '', profile: profile ?? null };
    try {
      const suggestions = await this.suggestions.suggest(kind, target, query.slice(0, 200));
      return { suggestions };
    } catch (error) {
      translate(error);
    }
  }
}
