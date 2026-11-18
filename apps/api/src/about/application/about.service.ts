import type { AboutDto } from '@bosco/domain';
import type { BuildInfoSource, ChangelogSource, Clock, ReleaseFeed, UpdateState, UpdateStore } from './ports.ts';
import { channelOf, downloadsOf, newestRelease, releaseVersionOf, type UpdateChannel } from '../domain/release.ts';

/** Une recherche automatique au plus par jour : un seul appel à GitHub, sans identifiant */
export const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface UpdateChoice {
  channel: UpdateChannel;
  enabled: boolean;
}

/**
 * Version de Bosco, journal des versions et mises à jour : la recherche d'une version plus récente sur GitHub (une
 * fois par jour au plus, désactivable), l'avis « Version X disponible » et le bandeau « Bosco X installé ».
 */
export class AboutService {
  private state: null | UpdateState = null;

  constructor(
    private readonly build: BuildInfoSource,
    private readonly feed: ReleaseFeed,
    private readonly store: UpdateStore,
    private readonly changelogSource: ChangelogSource,
    private readonly clock: Clock,
  ) {}

  /** Au démarrage (et après une remise à zéro) : une version différente du lancement précédent est une mise à jour. */
  async load(): Promise<void> {
    const state = await this.store.load();
    const running = releaseVersionOf(this.build.current().version);
    if (state.lastRunVersion !== running) {
      // Premier lancement : rien à annoncer ; ensuite, toute autre version est annoncée une fois
      state.installedNotice = state.lastRunVersion === null ? null : running;
      state.lastRunVersion = running;
      await this.store.save(state);
    }
    this.state = state;
  }

  async describe(): Promise<AboutDto> {
    const state = await this.current();
    const build = this.build.current();
    const version = releaseVersionOf(build.version);
    const channel = this.channelOf(state);
    // La release gardée n'est proposée que si elle reste plus récente que la version qui tourne, sur le canal choisi
    const available = state.latest ? newestRelease([state.latest], channel, version) : null;
    return {
      version,
      commit: build.release ? null : build.commit,
      release: build.release,
      install: build.install,
      updates: {
        enabled: state.enabled,
        channel,
        checkedAt: state.checkedAt?.toISOString() ?? null,
        error: state.error,
        available: available && {
          version: available.version,
          publishedAt: available.publishedAt.toISOString(),
          notes: available.notes,
          url: available.url,
          downloads: downloadsOf(available),
        },
        dismissed: available !== null && state.dismissed === available.version,
      },
      installed: state.installedNotice,
    };
  }

  changelog(): Promise<string> {
    return this.changelogSource.read();
  }

  /** Recherche activée ou non, et canal suivi ; changer de canal oublie la release gardée. */
  async choose(choice: UpdateChoice): Promise<AboutDto> {
    const state = await this.current();
    const changed = this.channelOf(state) !== choice.channel;
    await this.save({
      ...state,
      enabled: choice.enabled,
      channel: choice.channel,
      ...(changed ? { latest: null, checkedAt: null, error: null } : {}),
    });
    if (changed && choice.enabled) await this.check();
    return this.describe();
  }

  /** « Vérifier maintenant », et la recherche automatique : la plus récente des releases du canal. */
  async check(): Promise<AboutDto> {
    const state = await this.current();
    const checkedAt = this.clock.now();
    try {
      const releases = await this.feed.list();
      const latest = newestRelease(releases, this.channelOf(state), this.build.current().version);
      await this.save({ ...state, checkedAt, latest, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.save({ ...state, checkedAt, error: message });
    }
    return this.describe();
  }

  /** Recherche automatique : seulement si elle est activée et que la précédente date d'au moins un jour. */
  async checkIfDue(): Promise<void> {
    const state = await this.current();
    if (!state.enabled) return;
    if (state.checkedAt && this.clock.now().getTime() - state.checkedAt.getTime() < CHECK_INTERVAL_MS) return;
    await this.check();
  }

  /** Le bandeau fermé : « Bosco X installé » ne revient plus, l'avis d'une version disponible non plus. */
  async dismiss(notice: 'available' | 'installed', version: string): Promise<AboutDto> {
    const state = await this.current();
    if (notice === 'installed' && state.installedNotice === version)
      await this.save({ ...state, installedNotice: null });
    if (notice === 'available') await this.save({ ...state, dismissed: version });
    return this.describe();
  }

  private channelOf(state: UpdateState): UpdateChannel {
    return state.channel ?? channelOf(this.build.current().version);
  }

  private async current(): Promise<UpdateState> {
    if (!this.state) await this.load();
    return this.state as UpdateState;
  }

  private async save(state: UpdateState): Promise<void> {
    this.state = state;
    await this.store.save(state);
  }
}
