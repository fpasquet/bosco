import type { MikroORM } from '@mikro-orm/sqlite';
import { Inject, Module, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import type { Config } from '../config.ts';
import type { BuildInfoSource, ReleaseFeed } from './application/ports.ts';
import { CONFIG, ORM } from '../shared/tokens.ts';
import { AboutService } from './application/about.service.ts';
import { FileBuildInfo } from './infrastructure/disk/build-info.ts';
import { ChangelogFile } from './infrastructure/disk/changelog-file.ts';
import { GitHubReleaseFeed } from './infrastructure/github/github-release-feed.ts';
import { MikroOrmUpdateStore } from './infrastructure/persistence/update.store.ts';
import { ScriptedBuildInfo, ScriptedReleaseFeed } from './infrastructure/scripted/scripted-releases.ts';
import { AboutController } from './interface/http/about.controller.ts';
import { ABOUT_SERVICE, BUILD_INFO, RELEASE_FEED } from './tokens.ts';

/** Première recherche une minute après le démarrage, puis un contrôle par heure de la date de la dernière */
const FIRST_CHECK_MS = 60_000;
const TICK_MS = 60 * 60 * 1000;

/**
 * Version de Bosco et mises à jour. Dans les scénarios, les releases et la version sont scriptées (POST
 * /__test/releases, /__test/version) et aucune recherche ne part seule.
 */
@Module({
  controllers: [AboutController],
  providers: [
    {
      provide: RELEASE_FEED,
      inject: [CONFIG],
      useFactory: (config: Config): ReleaseFeed =>
        config.testing ? new ScriptedReleaseFeed() : new GitHubReleaseFeed(config.about.releasesUrl),
    },
    {
      provide: BUILD_INFO,
      inject: [CONFIG],
      useFactory: (config: Config): BuildInfoSource =>
        config.testing ? new ScriptedBuildInfo() : new FileBuildInfo(config.about.appRoot, config.about.install),
    },
    {
      provide: ABOUT_SERVICE,
      inject: [ORM, CONFIG, BUILD_INFO, RELEASE_FEED],
      useFactory: (orm: MikroORM, config: Config, build: BuildInfoSource, feed: ReleaseFeed) =>
        new AboutService(build, feed, new MikroOrmUpdateStore(orm), new ChangelogFile(config.about.appRoot), {
          now: () => new Date(),
        }),
    },
  ],
  exports: [ABOUT_SERVICE, RELEASE_FEED, BUILD_INFO],
})
export class AboutModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private timers: NodeJS.Timeout[] = [];

  constructor(
    @Inject(ABOUT_SERVICE) private readonly about: AboutService,
    @Inject(CONFIG) private readonly config: Config,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.about.load();
    if (this.config.testing) return;
    const check = () => void this.about.checkIfDue().catch(() => undefined);
    this.timers.push(setTimeout(check, FIRST_CHECK_MS).unref(), setInterval(check, TICK_MS).unref());
  }

  onApplicationShutdown(): void {
    for (const timer of this.timers) clearTimeout(timer);
  }
}
