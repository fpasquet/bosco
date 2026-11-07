import { Body, ConflictException, Controller, Get, HttpCode, Inject, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import type { SessionDto } from '@bosco/domain';
import type { LiveSignalService } from '../../application/live-signal.service.ts';
import type { SessionService } from '../../application/session.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { PermissionAlreadySettled } from '../../application/live-signal.service.ts';
import { LIVE_SIGNAL_SERVICE, SESSION_SERVICE } from '../../tokens.ts';
import { presentSession } from './session.presenter.ts';

/** Réponse à une autorisation : pour cette seule commande, sans « toujours autoriser » (CA-SESS-35). */
const permissionAnswerSchema = z.discriminatedUnion('behavior', [
  z.object({ behavior: z.literal('allow'), requestId: z.string().min(1) }),
  z.object({
    behavior: z.literal('deny'),
    requestId: z.string().min(1),
    reason: z.string().trim().max(2000).nullish(),
  }),
]);

@Controller('api/sessions')
export class SessionsController {
  constructor(
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionService,
    @Inject(LIVE_SIGNAL_SERVICE) private readonly liveSignals: LiveSignalService,
  ) {}

  @Get()
  async listSessions(): Promise<{ sessions: SessionDto[] }> {
    const sessions = await this.sessionService.listSessions();
    return { sessions: sessions.map(presentSession) };
  }

  /** 409 quand le terminal a répondu le premier : la première réponse l'emporte (RF-SESS-03, CA-SESS-33). */
  @Post(':id/permission')
  @HttpCode(204)
  async answerPermission(@Param('id') id: string, @Body() body: unknown): Promise<void> {
    const answer = parseBody(permissionAnswerSchema, body);
    try {
      await this.liveSignals.answerPermission(
        id,
        answer.requestId,
        answer.behavior === 'allow' ? { behavior: 'allow' } : { behavior: 'deny', reason: answer.reason || null },
      );
    } catch (error) {
      if (error instanceof PermissionAlreadySettled) throw new ConflictException({ code: error.code });
      throw error;
    }
  }
}
