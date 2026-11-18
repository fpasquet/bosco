import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { AccessService } from './access/application/access.service.ts';
import type { Config } from './config.ts';
import type { ContainersService } from './isolation/application/containers.service.ts';
import type { IsolationService } from './isolation/application/isolation.service.ts';
import type { QuotaService } from './isolation/application/quota.service.ts';
import type { DataService } from './maintenance/application/data.service.ts';
import type { GroupService } from './projects/application/group.service.ts';
import type { ProjectService } from './projects/application/project.service.ts';
import type { ChannelService } from './sessions/application/channel.service.ts';
import type { LiveSignalService } from './sessions/application/live-signal.service.ts';
import type { PilotService } from './sessions/application/pilot.service.ts';
import type { SettingsService } from './sessions/application/settings.service.ts';
import type { SourceRemovalService } from './sessions/application/source-removal.service.ts';
import type { SourceService } from './sessions/application/source.service.ts';
import type { FileTranscriptWatcher } from './sessions/infrastructure/claude-code/transcript-watcher.ts';
import { ACCESS_SERVICE } from './access/tokens.ts';
import { CONTAINERS_SERVICE, ISOLATION_SERVICE, QUOTA_SERVICE } from './isolation/tokens.ts';
import { DATA_SERVICE } from './maintenance/tokens.ts';
import { GROUP_SERVICE, PROJECT_SERVICE } from './projects/tokens.ts';
import {
  CHANNEL_SERVICE,
  LIVE_SIGNAL_SERVICE,
  PILOT_SERVICE,
  SETTINGS_SERVICE,
  SOURCE_REMOVAL_SERVICE,
  SOURCE_SERVICE,
  TRANSCRIPT_WATCHER,
} from './sessions/tokens.ts';
import { CONFIG } from './shared/tokens.ts';

/**
 * Données de Bosco et retrait d'une source : ils croisent tous les contextes. Un profil retiré libère les groupes, les
 * projets et l'abonnement par défaut qui le prenaient ; la réinitialisation arrête ce qui tourne, nettoie les profils,
 * vide la base et relit l'état de chaque contexte, sans redémarrer.
 */
@Injectable()
export class MaintenanceWiring implements OnModuleInit {
  constructor(
    @Inject(CONFIG) private readonly config: Config,
    @Inject(DATA_SERVICE) private readonly data: DataService,
    @Inject(SOURCE_SERVICE) private readonly sources: SourceService,
    @Inject(SOURCE_REMOVAL_SERVICE) private readonly removal: SourceRemovalService,
    @Inject(PILOT_SERVICE) private readonly pilot: PilotService,
    @Inject(TRANSCRIPT_WATCHER) private readonly watcher: FileTranscriptWatcher,
    @Inject(LIVE_SIGNAL_SERVICE) private readonly liveSignals: LiveSignalService,
    @Inject(CHANNEL_SERVICE) private readonly channel: ChannelService,
    @Inject(SETTINGS_SERVICE) private readonly settings: SettingsService,
    @Inject(ACCESS_SERVICE) private readonly access: AccessService,
    @Inject(ISOLATION_SERVICE) private readonly isolation: IsolationService,
    @Inject(QUOTA_SERVICE) private readonly quota: QuotaService,
    @Inject(PROJECT_SERVICE) private readonly projects: ProjectService,
    @Inject(GROUP_SERVICE) private readonly groups: GroupService,
    @Inject(CONTAINERS_SERVICE) private readonly containers: ContainersService,
  ) {}

  onModuleInit(): void {
    this.removal.useReferences({ using: (path) => this.profileUse(path), release: (path) => this.release(path) });
    this.data.useSessions({
      chooseHistory: (period) => this.sources.chooseHistory(period),
      describeHistory: () => this.sources.describeHistory(),
      resetImpact: async () => {
        const [{ sources }, profiles] = await Promise.all([
          this.sources.listSources(),
          this.removal.listInstalledProfiles(),
        ]);
        return { branches: this.pilot.unretrievedBranches(), profiles, sources: sources.length };
      },
    });
    this.data.useCatalog({
      countGroups: async () => {
        const groups = await this.groups.listGroups();
        return groups.filter(({ system }) => !system).length;
      },
      countProjects: () => this.projects.listProjects().length,
    });
    this.data.useReset({
      stopActivity: async () => {
        await this.sources.stopImport();
        await this.pilot.removeAllSandboxes();
        // Le dossier des bacs à sable est à Bosco : copies des projets et conversations des agents
        await rm(join(this.config.dataDir, 'sandboxes'), { recursive: true, force: true });
      },
      cleanProfiles: () => this.removal.cleanProfiles(),
      forgetState: async () => {
        await this.sources.stopWatching();
        await this.watcher.close();
        this.liveSignals.forget();
        this.channel.forget();
        // Les téléphones appairés sont effacés : l'accès du téléphone s'arrête avec eux
        await this.access.disable();
      },
      reload: async () => {
        await this.settings.load();
        await this.isolation.load();
        await this.quota.load();
        await this.projects.load();
        await this.groups.load();
        await this.pilot.load();
        await this.containers.measure().catch(() => undefined);
      },
    });
  }

  /** Groupes et projets qui prennent ce profil par défaut, et l'abonnement par défaut avant et après son retrait. */
  private async profileUse(
    path: string,
  ): Promise<{ defaultSubscription: boolean; groups: string[]; projects: string[]; subscription: null | string }> {
    const [groups, { subscription }] = await Promise.all([this.groups.listGroups(), this.isolation.snapshot()]);
    const defaultSubscription = subscription.profile === path;
    const next = subscription.choices.find((choice) => choice.path !== path) ?? null;
    return {
      defaultSubscription,
      groups: groups.filter(({ defaults, system }) => !system && defaults.profile === path).map(({ name }) => name),
      projects: this.projects
        .listProjects()
        .filter(({ defaults }) => defaults.profile === path)
        .map(({ name }) => name),
      subscription: defaultSubscription ? (next?.label ?? null) : subscription.label,
    };
  }

  /** Ils reprennent l'abonnement par défaut ; s'il l'était, le profil surveillé suivant le devient. */
  private async release(path: string): Promise<void> {
    const groups = await this.groups.listGroups();
    for (const group of groups.filter(({ defaults, system }) => !system && defaults.profile === path))
      await this.groups.changeGroup(group.id, { defaults: { profile: null } });
    for (const project of this.projects.listProjects().filter(({ defaults }) => defaults.profile === path))
      await this.projects.changeProject(project.id, { defaults: { profile: null } });
    const { subscription } = await this.isolation.snapshot();
    if (subscription.profile !== path) return;
    const next = subscription.choices.find((choice) => choice.path !== path) ?? null;
    await this.isolation.setSubscription(next?.path ?? null);
  }
}
