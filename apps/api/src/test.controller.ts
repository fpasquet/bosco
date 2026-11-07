import type { MikroORM } from '@mikro-orm/sqlite';
import { Controller, HttpCode, Inject, Post } from '@nestjs/common';
import type { LiveSignalService } from './sessions/application/live-signal.service.ts';
import type { FileTranscriptWatcher } from './sessions/infrastructure/claude-code/transcript-watcher.ts';
import { LIVE_SIGNAL_SERVICE, TRANSCRIPT_WATCHER } from './sessions/tokens.ts';
import { ORM } from './shared/tokens.ts';

/** Route réservée aux scénarios (BOSCO_TEST=1) : remet le service à zéro entre deux scénarios. */
@Controller('__test')
export class TestController {
  constructor(
    @Inject(ORM) private readonly orm: MikroORM,
    @Inject(TRANSCRIPT_WATCHER) private readonly watcher: FileTranscriptWatcher,
    @Inject(LIVE_SIGNAL_SERVICE) private readonly liveSignals: LiveSignalService,
  ) {}

  @Post('reset')
  @HttpCode(204)
  async reset(): Promise<void> {
    await this.watcher.close();
    this.liveSignals.forget();
    await this.orm.schema.clear();
    (globalThis as { boscoReplayReset?: () => void }).boscoReplayReset?.();
  }
}
