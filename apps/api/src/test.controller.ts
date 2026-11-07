import type { MikroORM } from '@mikro-orm/sqlite';
import { Controller, Get, HttpCode, Inject, Post } from '@nestjs/common';
import type { AccessService } from './access/application/access.service.ts';
import type { LiveSignalService } from './sessions/application/live-signal.service.ts';
import type { SettingsService } from './sessions/application/settings.service.ts';
import type { FileTranscriptWatcher } from './sessions/infrastructure/claude-code/transcript-watcher.ts';
import type { RecordingNotifier } from './sessions/infrastructure/notifications/desktop-notifier.ts';
import { ACCESS_SERVICE } from './access/tokens.ts';
import { LIVE_SIGNAL_SERVICE, NOTIFIER, SETTINGS_SERVICE, TRANSCRIPT_WATCHER } from './sessions/tokens.ts';
import { ORM } from './shared/tokens.ts';

/** Route réservée aux scénarios (BOSCO_TEST=1) : remet le service à zéro entre deux scénarios. */
@Controller('__test')
export class TestController {
  constructor(
    @Inject(ORM) private readonly orm: MikroORM,
    @Inject(TRANSCRIPT_WATCHER) private readonly watcher: FileTranscriptWatcher,
    @Inject(LIVE_SIGNAL_SERVICE) private readonly liveSignals: LiveSignalService,
    @Inject(NOTIFIER) private readonly notifier: RecordingNotifier,
    @Inject(SETTINGS_SERVICE) private readonly settings: SettingsService,
    @Inject(ACCESS_SERVICE) private readonly access: AccessService,
  ) {}

  /** Notifications du bureau envoyées depuis la dernière remise à zéro (RF-SESS-08). */
  @Get('notifications')
  notifications(): { notifications: { body: string; title: string }[] } {
    return { notifications: this.notifier.sent };
  }

  @Post('reset')
  @HttpCode(204)
  async reset(): Promise<void> {
    await this.watcher.close();
    await this.access.disable();
    this.liveSignals.forget();
    this.notifier.sent.splice(0);
    await this.orm.schema.clear();
    // L'index de recherche n'est pas une entité : il se vide à part
    await this.orm.em.getConnection().execute('delete from session_search');
    await this.settings.load();
    (globalThis as { boscoReplayReset?: () => void }).boscoReplayReset?.();
  }
}
