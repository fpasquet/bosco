import type { BuildInfo, BuildInfoSource, ReleaseFeed } from '../../application/ports.ts';
import type { PublishedRelease } from '../../domain/release.ts';

/** Releases des scénarios : posées par POST /__test/releases, sans appel à GitHub. */
export class ScriptedReleaseFeed implements ReleaseFeed {
  releases: PublishedRelease[] = [];
  /** Simule GitHub injoignable */
  failing = false;

  list(): Promise<PublishedRelease[]> {
    return this.failing ? Promise.reject(new Error('GitHub answered 503')) : Promise.resolve(this.releases);
  }
}

/** Version des scénarios : une release 0.2.0 installée depuis le paquet, sauf si un scénario en pose une autre. */
export class ScriptedBuildInfo implements BuildInfoSource {
  static readonly DEFAULT: BuildInfo = { version: '0.2.0', commit: null, release: true, install: 'deb' };
  info: BuildInfo = ScriptedBuildInfo.DEFAULT;

  current(): BuildInfo {
    return this.info;
  }
}
