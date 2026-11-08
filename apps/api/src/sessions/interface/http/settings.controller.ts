import { BadRequestException, Body, Controller, Get, Inject, Put } from '@nestjs/common';
import { z } from 'zod';
import type { SessionService } from '../../application/session.service.ts';
import type { SettingsService } from '../../application/settings.service.ts';
import type { DiscoverySnapshot } from '../../domain/repository-discovery.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { CONFIG } from '../../../shared/tokens.ts';
import { InvalidSetting, type SettingsSnapshot } from '../../domain/settings.ts';
import { SESSION_SERVICE, SETTINGS_SERVICE } from '../../tokens.ts';

const FOLDERS_LIMIT = 50;
const folders = z.array(z.string().max(1024)).max(FOLDERS_LIMIT);

const settingsSchema = z
  .object({
    desktopNotifications: z.boolean(),
    inactivityMinutes: z.number().int(),
    repositories: z
      .object({
        attachWorktrees: z.boolean(),
        excluded: folders,
        gitOnly: z.boolean(),
        hidden: z.array(z.string().max(4096)).max(1000),
        roots: folders,
      })
      .partial()
      .strict(),
  })
  .partial()
  .strict();

/** Dépôts découverts (E4d) : réglages, dépôts trouvés et sessions hors dépôt git. */
export interface RepositorySettingsView {
  /** Dossier personnel, pour écrire les chemins comme dans le terminal (« ~/www ») */
  home: string;
  outside: number;
  repositories: { git: boolean; hidden: boolean; lastActivityAt: Date; name: string; root: string }[];
  settings: DiscoverySnapshot;
}

/** Réglages des sources (E4a) et des dépôts découverts (E4d) ; ils ne s'écrivent que depuis le poste. */
@Controller('api/settings')
export class SettingsController {
  constructor(
    @Inject(SETTINGS_SERVICE) private readonly settings: SettingsService,
    @Inject(SESSION_SERVICE) private readonly sessions: SessionService,
    /** Dossier personnel des profils (celui du scénario dans les tests) */
    @Inject(CONFIG) private readonly config: { profilesRoot: string },
  ) {}

  @Get()
  current(): SettingsSnapshot {
    return this.settings.current();
  }

  @Get('repositories')
  async repositories(): Promise<RepositorySettingsView> {
    const { outside, repositories } = await this.sessions.discoveredRepositories();
    return { home: this.config.profilesRoot, outside, repositories, settings: this.settings.repositories() };
  }

  @Put()
  async update(@Body() body: unknown): Promise<SettingsSnapshot> {
    const changes = parseBody(settingsSchema, body);
    try {
      return await this.settings.update(changes);
    } catch (error) {
      if (error instanceof InvalidSetting) throw new BadRequestException({ code: error.code, message: error.message });
      throw error;
    }
  }
}
