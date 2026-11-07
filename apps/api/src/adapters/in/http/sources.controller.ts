import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { homedir } from 'node:os';
import { z } from 'zod';
import type { SourceService, SourceSnapshot, SourcesView } from '@bosco/core/sessions';
import { SOURCE_SERVICE } from '../../../tokens.ts';
import { parseBody } from './http-errors.ts';

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
