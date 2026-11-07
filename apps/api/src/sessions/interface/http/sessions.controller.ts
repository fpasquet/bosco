import { Controller, Get, Inject } from '@nestjs/common';
import type { SessionDto } from '@bosco/domain';
import type { SessionService } from '../../application/session.service.ts';
import { SESSION_SERVICE } from '../../tokens.ts';
import { presentSession } from './session.presenter.ts';

@Controller('api/sessions')
export class SessionsController {
  constructor(@Inject(SESSION_SERVICE) private readonly sessionService: SessionService) {}

  @Get()
  async listSessions(): Promise<{ sessions: SessionDto[] }> {
    const sessions = await this.sessionService.listSessions();
    return { sessions: sessions.map(presentSession) };
  }
}
