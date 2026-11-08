import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { homedir } from 'node:os';
import { z } from 'zod';
import type { SourceService, SourcesView } from '../../application/source.service.ts';
import type { SourceSnapshot } from '../../domain/source.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { SOURCE_SERVICE } from '../../tokens.ts';

const watchProfilesSchema = z.object({ paths: z.array(z.string().min(1)) });
const sourceSchema = z.object({ watched: z.boolean() }).strict();

@Controller('api/sources')
export class SourcesController {
  constructor(@Inject(SOURCE_SERVICE) private readonly sourceService: SourceService) {}

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

  /** Interrupteur d'une source (E4a) : la lecture s'arrête ou reprend, rien n'est effacé (CA-SESS-56). */
  @Patch(':id')
  async updateSource(@Param('id') id: string, @Body() body: unknown): Promise<SourceSnapshot> {
    const { watched } = parseBody(sourceSchema, body);
    const source = await this.sourceService.setWatched(id, watched);
    if (!source) throw new NotFoundException({ code: 'unknownSource' });
    return source;
  }
}
