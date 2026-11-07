import type { ServerResponse } from 'node:http';
import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { LiveSignal, LiveSignalService, PermissionAnswer } from '../../application/live-signal.service.ts';
import type { SourceService } from '../../application/source.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { describeAction } from '../../domain/action-summary.ts';
import { HOOK_SECRET, LIVE_SIGNAL_SERVICE, SOURCE_SERVICE } from '../../tokens.ts';

/** Entrée commune des hooks de Claude Code ; le reste du corps, propre à chaque événement, est ignoré (NF-08). */
const hookSchema = z.looseObject({
  session_id: z.string().min(1),
  hook_event_name: z.string().min(1),
  cwd: z.string().optional(),
  tool_name: z.string().optional(),
  tool_input: z.unknown().optional(),
  last_assistant_message: z.string().nullish(),
});

type HookInput = z.infer<typeof hookSchema>;

/**
 * Message d'un refus : Claude Code le rend à l'agent comme une erreur de l'outil, sans rien autour. Il dit donc que la
 * personne a refusé, sinon un motif court (« description ») passe pour une panne de l'outil (CA-SESS-34).
 */
export function refusalMessage(reason: null | string): string {
  const refused = 'La personne a refusé cette commande depuis Bosco.';
  return reason ? `${refused} Motif : ${reason}` : refused;
}

/** Réponse du hook PermissionRequest (documentation des hooks de Claude Code) : la décision, pour cette seule commande. */
function permissionOutput(answer: PermissionAnswer) {
  const decision =
    answer.behavior === 'allow' ? { behavior: 'allow' } : { behavior: 'deny', message: refusalMessage(answer.reason) };
  return { hookSpecificOutput: { hookEventName: 'PermissionRequest', decision } };
}

function signalOf(input: HookInput): LiveSignal | null {
  switch (input.hook_event_name) {
    case 'PostToolUse':
      return { kind: 'tool' };
    case 'SessionEnd':
      return { kind: 'end' };
    case 'SessionStart':
      return { kind: 'start' };
    case 'Stop':
      return { kind: 'stop', message: input.last_assistant_message ?? null };
    case 'UserPromptSubmit':
      return { kind: 'prompt' };
    default:
      return null;
  }
}

/**
 * Entrée des hooks HTTP du suivi en direct (DT-05, DT-07). Bosco n'écoute que sur la boucle locale, et chaque appel
 * porte le secret de l'installation. Une autorisation reste en attente jusqu'à la première réponse : celle de Bosco
 * part dans la réponse du hook ; si Claude Code ferme la connexion, le terminal a répondu le premier.
 */
@Controller('api/hooks')
export class HooksController {
  constructor(
    @Inject(LIVE_SIGNAL_SERVICE) private readonly liveSignals: LiveSignalService,
    @Inject(SOURCE_SERVICE) private readonly sourceService: SourceService,
    @Inject(HOOK_SECRET) private readonly secret: string,
  ) {}

  @Post(':sourceId')
  @HttpCode(200)
  async receive(
    @Param('sourceId') sourceId: string,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: { raw: ServerResponse },
  ): Promise<Record<string, never> | ReturnType<typeof permissionOutput>> {
    this.authenticate(authorization);
    const { sources } = await this.sourceService.listSources();
    if (!sources.some((source) => source.id === sourceId)) throw new NotFoundException({ code: 'unknownSource' });
    const input = parseBody(hookSchema, body);
    const origin = { sessionId: input.session_id, sourceId, cwd: input.cwd ?? null };
    if (input.hook_event_name === 'PermissionRequest') {
      const { detail } = describeAction(input.tool_name ?? 'Outil', input.tool_input);
      const answer = await this.liveSignals.requestPermission(
        origin,
        { tool: input.tool_name ?? 'Outil', detail },
        (onAbandon) =>
          reply.raw.once('close', () => {
            if (!reply.raw.writableFinished) onAbandon();
          }),
      );
      // null : Claude Code a déjà fermé la connexion, il n'y a plus personne à qui répondre
      return answer ? permissionOutput(answer) : {};
    }
    const signal = signalOf(input);
    if (signal) await this.liveSignals.receive(origin, signal);
    return {};
  }

  private authenticate(authorization: string | undefined): void {
    const expected = Buffer.from(`Bearer ${this.secret}`);
    const given = Buffer.from(authorization ?? '');
    if (given.length !== expected.length || !timingSafeEqual(given, expected))
      throw new ForbiddenException({ code: 'invalidHookSecret' });
  }
}
