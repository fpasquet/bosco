import type { MikroORM } from '@mikro-orm/sqlite';
import { Controller, HttpCode, Inject, Post } from '@nestjs/common';
import type { FileTranscriptWatcher } from '../transcripts/transcript-watcher.ts';
import { ORM, TRANSCRIPT_WATCHER } from '../../../tokens.ts';

/** Route réservée aux scénarios (BOSCO_TEST=1) : remet le service à zéro entre deux scénarios. */
@Controller('__test')
export class TestController {
  constructor(
    @Inject(ORM) private readonly orm: MikroORM,
    @Inject(TRANSCRIPT_WATCHER) private readonly watcher: FileTranscriptWatcher,
  ) {}

  @Post('reset')
  @HttpCode(204)
  async reset(): Promise<void> {
    await this.watcher.close();
    await this.orm.schema.clear();
    (globalThis as { boscoReplayReset?: () => void }).boscoReplayReset?.();
  }
}
