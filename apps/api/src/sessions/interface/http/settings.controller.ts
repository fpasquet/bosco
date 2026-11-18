import { BadRequestException, Body, Controller, Get, Inject, Put } from '@nestjs/common';
import { z } from 'zod';
import type { SettingsService } from '../../application/settings.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { InvalidSetting, type SettingsSnapshot } from '../../domain/settings.ts';
import { SETTINGS_SERVICE } from '../../tokens.ts';

const settingsSchema = z
  .object({
    desktopNotifications: z.boolean(),
    inactivityMinutes: z.number().int(),
    notifications: z
      .object({
        ended: z.boolean(),
        failed: z.boolean(),
        inAppWhenForeground: z.boolean(),
        longTurnMinutes: z.number().int(),
        permission: z.boolean(),
        question: z.boolean(),
        review: z.boolean(),
        turn: z.enum(['always', 'long', 'never']),
        turnQuestion: z.boolean(),
      })
      .partial()
      .strict(),
  })
  .partial()
  .strict();

/** Réglages des sources ; ils ne s'écrivent que depuis le poste. */
@Controller('api/settings')
export class SettingsController {
  constructor(@Inject(SETTINGS_SERVICE) private readonly settings: SettingsService) {}

  @Get()
  current(): SettingsSnapshot {
    return this.settings.current();
  }

  @Put()
  async update(@Body() body: unknown): Promise<SettingsSnapshot> {
    const changes = parseBody(settingsSchema, body);
    try {
      return await this.settings.update(changes);
    } catch (error) {
      if (error instanceof InvalidSetting) throw new BadRequestException({ code: error.code, message: error.message });
      throw error;
    }
  }
}
