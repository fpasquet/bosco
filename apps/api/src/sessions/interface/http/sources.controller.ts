import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
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
import type { SourceService, SourcesView } from '../../application/source.service.ts';
import { sessionDefaultsSchema } from '../../../shared/interface/http/defaults-schema.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { UnknownProfile } from '../../application/session-defaults.service.ts';
import { NotAProfile, SourceAlreadyKnown } from '../../application/source.service.ts';
import { ManagedSource, type SourceSnapshot } from '../../domain/source.ts';
import { SESSION_DEFAULTS_SERVICE, SOURCE_SERVICE } from '../../tokens.ts';

const watchProfilesSchema = z.object({ paths: z.array(z.string().min(1)) });
const sourceSchema = z.object({ watched: z.boolean() }).strict();
const folderSchema = z.object({ path: z.string().trim().min(1) }).strict();

/** Chemin écrit comme dans le terminal (~/.claude-pro) : le dossier personnel remplace ~. */
function absolute(path: string): string {
  return resolve(path === '~' || path.startsWith('~/') ? `${homedir()}${path.slice(1)}` : path);
}

/** Réglages d'un profil tels que l'interface les lit ; une valeur absente du profil Claude Code reste null. */
function presentProfile(view: ProfileSettingsView): ProfileSettingsDto {
  return view;
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
  ) {}

  /** Réglages d'un profil (E4g) : son compte, ses valeurs par défaut et leur origine, ce qui l'utilise. */
  @Get(':id/settings')
  async getProfileSettings(@Param('id') id: string): Promise<ProfileSettingsDto> {
    const view = await known(() => this.defaults.getProfileSettings(id));
    return presentProfile(view);
  }

  /** « Enregistrer » les valeurs par défaut d'un profil, gardées par Bosco (CA-REGL-19). */
  @Put(':id/defaults')
  async changeProfileDefaults(@Param('id') id: string, @Body() body: unknown): Promise<ProfileSettingsDto> {
    const changes = parseBody(sessionDefaultsSchema.partial(), body) as SessionDefaultsChanges;
    const view = await known(() => this.defaults.changeProfileDefaults(id, changes));
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
    const { paths } = parseBody(watchProfilesSchema, body);
    const sources = await this.sourceService.watchProfiles(paths);
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

  /** Interrupteur d'une source (E4a) : la lecture s'arrête ou reprend, rien n'est effacé (CA-SESS-56). */
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
