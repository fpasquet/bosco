import { Body, Controller, Get, HttpCode, Inject, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import type { AboutDto } from '@bosco/domain';
import type { AboutService } from '../../application/about.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { ABOUT_SERVICE } from '../../tokens.ts';

const updatesSchema = z.object({ enabled: z.boolean(), channel: z.enum(['beta', 'stable']) }).strict();
const dismissSchema = z
  .object({ notice: z.enum(['available', 'installed']), version: z.string().trim().min(1).max(100) })
  .strict();

/** Réglages › À propos : la version qui tourne, les mises à jour et le journal des versions. */
@Controller('api/about')
export class AboutController {
  constructor(@Inject(ABOUT_SERVICE) private readonly about: AboutService) {}

  @Get()
  describe(): Promise<AboutDto> {
    return this.about.describe();
  }

  /** Le journal des versions embarqué avec la version qui tourne, en Markdown. */
  @Get('changelog')
  async changelog(): Promise<{ markdown: string }> {
    return { markdown: await this.about.changelog() };
  }

  /** Recherche des mises à jour activée ou non, et canal suivi (stable, ou aussi les betas). */
  @Put('updates')
  choose(@Body() body: unknown): Promise<AboutDto> {
    return this.about.choose(parseBody(updatesSchema, body));
  }

  /** « Vérifier maintenant » : un appel aux releases de GitHub, même si la recherche automatique est coupée. */
  @Post('check')
  @HttpCode(200)
  check(): Promise<AboutDto> {
    return this.about.check();
  }

  /** Bandeau fermé : « Bosco X installé », ou l'avis d'une version disponible. */
  @Post('dismiss')
  @HttpCode(200)
  dismiss(@Body() body: unknown): Promise<AboutDto> {
    const { notice, version } = parseBody(dismissSchema, body);
    return this.about.dismiss(notice, version);
  }
}
