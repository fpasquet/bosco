import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { homedir } from 'node:os';
import { z } from 'zod';
import type { SourceService, SourcesView } from '../../application/source.service.ts';
import type { SourceSnapshot } from '../../domain/source.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { SOURCE_SERVICE } from '../../tokens.ts';

const watchProfilesSchema = z.object({ paths: z.array(z.string().min(1)) });

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
}
