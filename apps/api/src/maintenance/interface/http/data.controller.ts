import { BadRequestException, Body, Controller, Get, HttpCode, Inject, Post, Put } from '@nestjs/common';
import { homedir } from 'node:os';
import { z } from 'zod';
import type { DataService, DataView } from '../../application/data.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { ResetNotConfirmed } from '../../domain/reset.ts';
import { DATA_SERVICE } from '../../tokens.ts';

const historySchema = z.object({ period: z.enum(['30-days', 'all']) }).strict();
const resetSchema = z.object({ confirm: z.string() }).strict();

/** Réglages › Données : l'historique importé, la base de Bosco et sa réinitialisation. */
@Controller('api')
export class DataController {
  constructor(@Inject(DATA_SERVICE) private readonly data: DataService) {}

  @Get('data')
  async describeData(): Promise<DataView & { home: string }> {
    const view = await this.data.describeData();
    // Le dossier personnel, pour que l'interface écrive les chemins comme le terminal
    return { ...view, home: homedir() };
  }

  /** Période de l'historique : tout l'historique lit les transcripts plus anciens en arrière-plan. */
  @Put('data/history')
  async chooseHistory(@Body() body: unknown): Promise<DataView & { home: string }> {
    const { period } = parseBody(historySchema, body);
    const view = await this.data.chooseHistory(period);
    return { ...view, home: homedir() };
  }

  /** « Tout effacer » : Bosco revient au premier lancement, sans rien toucher dans les dossiers de Claude Code. */
  @Post('reset')
  @HttpCode(204)
  async resetAll(@Body() body: unknown): Promise<void> {
    const { confirm } = parseBody(resetSchema, body);
    await this.data.resetAll(confirm).catch((error: unknown) => {
      if (error instanceof ResetNotConfirmed)
        throw new BadRequestException({ code: error.code, message: error.message });
      throw error;
    });
  }
}
