import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import type { LinkDto } from '@bosco/domain';
import type { LinkSnapshot } from '../../domain/link.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { InvalidLink, type LinksService } from '../../application/links.service.ts';
import { LINKS_SERVICE } from '../../tokens.ts';

const addSchema = z.object({ url: z.string().max(2000) });

function present(link: LinkSnapshot): LinkDto {
  return { ...link, readAt: link.readAt?.toISOString() ?? null };
}

async function settle<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof InvalidLink) throw new BadRequestException({ message: error.message });
    throw error;
  }
}

/** Liens des tâches (E10b) et connexions des intégrations (E10a), dont les accès ne sortent jamais de Bosco. */
@Controller('api')
export class LinksController {
  constructor(@Inject(LINKS_SERVICE) private readonly links: LinksService) {}

  @Get('links/recognize')
  recognize(@Query('url') url: string) {
    return this.links.recognize(url ?? '');
  }

  @Get('tasks/:id/links')
  async forTask(@Param('id', ParseIntPipe) id: number): Promise<{ links: LinkDto[] }> {
    const links = await this.links.forTask(id);
    return { links: links.map(present) };
  }

  @Post('tasks/:id/links')
  async add(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<LinkDto> {
    const { url } = parseBody(addSchema, body);
    const link = await settle(() => this.links.add(id, url));
    return present(link);
  }

  @Delete('tasks/:id/links/:link')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number, @Param('link', ParseIntPipe) link: number): Promise<void> {
    await this.links.remove(id, link);
  }
}
