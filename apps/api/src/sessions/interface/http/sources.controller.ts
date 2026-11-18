import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { ProfileSettingsDto } from '@bosco/domain';
import type { SessionDefaultsChanges } from '../../../shared/domain/session-settings.ts';
import type { ProfileSettingsView, SessionDefaultsService } from '../../application/session-defaults.service.ts';
import type { SourceRemoval, SourceRemovalService } from '../../application/source-removal.service.ts';
import type { SourceService, SourcesView } from '../../application/source.service.ts';
import { sessionDefaultsSchema } from '../../../shared/interface/http/defaults-schema.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { UnknownSource } from '../../application/live-tracking.service.ts';
import { UnknownProfile } from '../../application/session-defaults.service.ts';
import { SourceBusy } from '../../application/source-removal.service.ts';
import { InvalidTokenFile, NotAProfile, SourceAlreadyKnown } from '../../application/source.service.ts';
import { ManagedSource, type SourceSnapshot } from '../../domain/source.ts';
import { SESSION_DEFAULTS_SERVICE, SOURCE_REMOVAL_SERVICE, SOURCE_SERVICE } from '../../tokens.ts';

const watchProfilesSchema = z.object({
  paths: z.array(z.string().min(1)),
  // Premier lancement : les 30 derniers jours (par défaut) ou tout l'historique des profils
  history: z.enum(['30-days', 'all']).optional(),
});
const sourceSchema = z.object({ watched: z.boolean() }).strict();
const folderSchema = z.object({ path: z.string().trim().min(1) }).strict();
const tokenSchema = z.object({ path: z.string().trim().min(1).nullable() }).strict();

/** Chemin écrit comme dans le terminal (~/.claude-pro) : le dossier personnel remplace ~. */
function absolute(path: string): string {
  return resolve(path === '~' || path.startsWith('~/') ? `${homedir()}${path.slice(1)}` : path);
}

/** Réglages d'un profil tels que l'interface les lit ; une valeur absente du profil Claude Code reste null. */
function presentProfile(view: ProfileSettingsView): ProfileSettingsDto {
  return view;
}

/** Retrait d'une source : inconnue, 404 ; tenue par Bosco ou avec un tour en cours, 409. */
async function removable<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof UnknownSource) throw new NotFoundException({ code: error.code, message: error.message });
    if (error instanceof ManagedSource || error instanceof SourceBusy)
      throw new ConflictException({ code: error.code, message: error.message });
    throw error;
  }
}

/** Un profil inconnu de Bosco répond 404. */
async function known<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof UnknownProfile) throw new NotFoundException({ code: error.code, message: error.message });
    throw error;
  }
}

@Controller('api/sources')
export class SourcesController {
  constructor(
    @Inject(SOURCE_SERVICE) private readonly sourceService: SourceService,
    @Inject(SESSION_DEFAULTS_SERVICE) private readonly defaults: SessionDefaultsService,
    @Inject(SOURCE_REMOVAL_SERVICE) private readonly removal: SourceRemovalService,
  ) {}

  /** Ce que retirer la source changerait : sessions oubliées, ce qui est retiré du profil, ce qui l'utilise. */
  @Get(':id/removal')
  async previewRemoval(@Param('id') id: string): Promise<SourceRemoval> {
    return removable(() => this.removal.previewRemoval(id));
  }

  /** « Retirer la source » : Bosco l'oublie avec ses sessions, sans rien supprimer dans le dossier du profil. */
  @Delete(':id')
  @HttpCode(204)
  async removeSource(@Param('id') id: string): Promise<void> {
    await removable(() => this.removal.removeSource(id));
  }

  /** Réglages d'un profil : son compte, ses valeurs par défaut et leur origine, ce qui l'utilise. */
  @Get(':id/settings')
  async getProfileSettings(@Param('id') id: string): Promise<ProfileSettingsDto> {
    const view = await known(() => this.defaults.getProfileSettings(id));
    return presentProfile(view);
  }

  /** « Enregistrer » les valeurs par défaut d'un profil, gardées par Bosco. */
  @Put(':id/defaults')
  async changeProfileDefaults(@Param('id') id: string, @Body() body: unknown): Promise<ProfileSettingsDto> {
    const changes = parseBody(sessionDefaultsSchema.partial(), body) as SessionDefaultsChanges;
    const view = await known(() => this.defaults.changeProfileDefaults(id, changes));
    return presentProfile(view);
  }

  /**
   * « Utiliser un jeton longue durée » : le fichier qui contient le jeton de `claude setup-token`, dont Bosco ne garde
   * que le chemin ; null le retire. Rend les réglages du profil, accès compris.
   */
  @Put(':id/token')
  async declareToken(@Param('id') id: string, @Body() body: unknown): Promise<ProfileSettingsDto> {
    const { path } = parseBody(tokenSchema, body);
    const source = await this.sourceService
      .declareToken(id, path === null ? null : absolute(path))
      .catch((error: unknown) => {
        if (error instanceof InvalidTokenFile)
          throw new BadRequestException({ code: error.code, message: error.message });
        if (error instanceof ManagedSource) throw new ConflictException({ code: error.code, message: error.message });
        throw error;
      });
    if (!source) throw new NotFoundException({ code: 'unknownSource' });
    const view = await known(() => this.defaults.getProfileSettings(id));
    return presentProfile(view);
  }

  @Get()
  async listSources(): Promise<SourcesView & { home: string }> {
    const view = await this.sourceService.listSources();
    // Le dossier personnel, pour que l'interface écrive les chemins comme le terminal (~/.claude)
    return { ...view, home: homedir() };
  }

  @Post()
  async watchProfiles(@Body() body: unknown): Promise<{ sources: SourceSnapshot[] }> {
    const { history, paths } = parseBody(watchProfilesSchema, body);
    const sources = await this.sourceService.watchProfiles(paths, history);
    return { sources };
  }

  /** « Ajouter un dossier » : un autre dossier de configuration de Claude Code, surveillé comme un profil. */
  @Post('folder')
  async addSource(@Body() body: unknown): Promise<SourceSnapshot> {
    const { path } = parseBody(folderSchema, body);
    return this.sourceService.addSource(absolute(path)).catch((error: unknown) => {
      if (error instanceof NotAProfile) throw new BadRequestException({ code: error.code, message: error.message });
      if (error instanceof SourceAlreadyKnown)
        throw new ConflictException({ code: error.code, message: error.message });
      throw error;
    });
  }

  /** Interrupteur d'une source : la lecture s'arrête ou reprend, rien n'est effacé. */
  @Patch(':id')
  async updateSource(@Param('id') id: string, @Body() body: unknown): Promise<SourceSnapshot> {
    const { watched } = parseBody(sourceSchema, body);
    const source = await this.sourceService.setWatched(id, watched).catch((error: unknown) => {
      if (error instanceof ManagedSource) throw new ConflictException({ code: error.code, message: error.message });
      throw error;
    });
    if (!source) throw new NotFoundException({ code: 'unknownSource' });
    return source;
  }
}
