import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Put } from '@nestjs/common';
import { z } from 'zod';
import type { LiveTrackingService, LiveTrackingStatus } from '../../application/live-tracking.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { UnknownSource } from '../../application/live-tracking.service.ts';
import { LIVE_TRACKING_SERVICE } from '../../tokens.ts';

const installSchema = z.object({ backup: z.boolean().default(true) });

interface LiveTrackingDto {
  backupPath?: null | string;
  installed: boolean;
  lastSignalAt: null | string;
  settingsPath: string;
}

function present(status: LiveTrackingStatus & { backupPath?: null | string }): LiveTrackingDto {
  return { ...status, lastSignalAt: status.lastSignalAt?.toISOString() ?? null };
}

/** Installation du suivi en direct d'un profil (E4b) : état, installation, désinstallation. */
@Controller('api/sources/:sourceId/live-tracking')
export class LiveTrackingController {
  constructor(@Inject(LIVE_TRACKING_SERVICE) private readonly liveTracking: LiveTrackingService) {}

  @Get()
  async status(@Param('sourceId') sourceId: string): Promise<LiveTrackingDto> {
    const status = await guard(this.liveTracking.status(sourceId));
    return present(status);
  }

  @Put()
  async install(@Param('sourceId') sourceId: string, @Body() body: unknown): Promise<LiveTrackingDto> {
    const { backup } = parseBody(installSchema, body ?? {});
    const status = await guard(this.liveTracking.install(sourceId, backup));
    return present(status);
  }

  @Delete()
  async uninstall(@Param('sourceId') sourceId: string): Promise<LiveTrackingDto> {
    const status = await guard(this.liveTracking.uninstall(sourceId));
    return present(status);
  }
}

async function guard<T>(work: Promise<T>): Promise<T> {
  try {
    return await work;
  } catch (error) {
    if (error instanceof UnknownSource) throw new NotFoundException({ code: error.code });
    throw error;
  }
}
