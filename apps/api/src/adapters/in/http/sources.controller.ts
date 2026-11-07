import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { z } from 'zod';
import type { SourceService, SourceSnapshot, SourcesView } from '@bosco/core/sessions';
import { SOURCE_SERVICE } from '../../../tokens.ts';
import { parseBody } from './http-errors.ts';

const watchProfilesSchema = z.object({ paths: z.array(z.string().min(1)) });

@Controller('api/sources')
export class SourcesController {
  constructor(@Inject(SOURCE_SERVICE) private readonly sourceService: SourceService) {}

  @Get()
  listSources(): Promise<SourcesView> {
    return this.sourceService.listSources();
  }

  @Post()
  async watchProfiles(@Body() body: unknown): Promise<{ sources: SourceSnapshot[] }> {
    const { paths } = parseBody(watchProfilesSchema, body);
    const sources = await this.sourceService.watchProfiles(paths);
    return { sources };
  }
}
