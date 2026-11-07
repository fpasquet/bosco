import { Controller, Get, Inject } from '@nestjs/common';
import type { SessionService, SessionView } from '@bosco/core/sessions';
import { SESSION_SERVICE } from '../../../tokens.ts';

@Controller('api/sessions')
export class SessionsController {
  constructor(@Inject(SESSION_SERVICE) private readonly sessionService: SessionService) {}

  @Get()
  async listSessions(): Promise<{ sessions: SessionView[] }> {
    const sessions = await this.sessionService.listSessions();
    return { sessions };
  }
}
