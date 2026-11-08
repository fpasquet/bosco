import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import type { SessionConversationDto, SessionDetailDto, SessionDto } from '@bosco/domain';
import type { ConversationService } from '../../application/conversation.service.ts';
import type { LiveSignalService } from '../../application/live-signal.service.ts';
import type { SessionService } from '../../application/session.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { PermissionAlreadySettled } from '../../application/live-signal.service.ts';
import { CONVERSATION_SERVICE, LIVE_SIGNAL_SERVICE, SESSION_SERVICE } from '../../tokens.ts';
import { presentConversation } from './conversation.presenter.ts';
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
    @Inject(CONVERSATION_SERVICE) private readonly conversations: ConversationService,
  ) {}

  @Get()
  async listSessions(): Promise<{ sessions: SessionDto[] }> {
    const sessions = await this.sessionService.listSessions();
    return { sessions: sessions.map(presentSession) };
  }

  /** Détail d'une session (E2) : sa vue et son fil ; le flux en direct signale ses changements. */
  @Get(':id')
  async sessionDetail(@Param('id') id: string): Promise<SessionDetailDto> {
    const detail = await this.sessionService.sessionDetail(id);
    if (!detail) throw new NotFoundException({ code: 'unknownSession' });
    return {
      session: presentSession(detail.session),
      journal: detail.journal.map((entry) => ({ ...entry, at: entry.at.toISOString() })),
    };
  }

  /**
   * Fil complet d'une session (E2a), lu dans son transcript : réflexions, outils avec entrée et résultat, réponses en
   * Markdown. 404 transcriptGone quand le fichier n'existe plus : le fil se rabat alors sur le journal.
   */
  @Get(':id/conversation')
  async sessionConversation(@Param('id') id: string): Promise<SessionConversationDto> {
    const result = await this.conversations.conversation(id);
    if (result.kind === 'unknownSession') throw new NotFoundException({ code: 'unknownSession' });
    if (result.kind === 'gone') throw new NotFoundException({ code: 'transcriptGone' });
    return presentConversation(result.conversation);
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
