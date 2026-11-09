import { Body, Controller, Get, HttpCode, Inject, Post } from '@nestjs/common';
import { z } from 'zod';
import type { NotificationDto } from '@bosco/domain';
import type { NotificationService } from '../../application/notification.service.ts';
import type { NotificationRecord } from '../../domain/notification.ts';
import type { PresenceTracker } from '../../infrastructure/notifications/presence.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { NOTIFICATION_SERVICE, PRESENCE } from '../../tokens.ts';

const readSchema = z.object({ id: z.number().int().nullable().default(null) }).strict();
const presenceSchema = z.object({ foreground: z.boolean() }).strict();

export function presentNotification(notification: NotificationRecord): NotificationDto {
  return {
    ...notification,
    at: notification.at.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
  };
}

/** Centre de notifications (E15a) ; le téléphone le lit et le marque lu. */
@Controller('api')
export class NotificationsController {
  constructor(
    @Inject(NOTIFICATION_SERVICE) private readonly notifications: NotificationService,
    @Inject(PRESENCE) private readonly presence: PresenceTracker,
  ) {}

  @Get('notifications')
  async list(): Promise<{ notifications: NotificationDto[]; unread: number }> {
    const { notifications, unread } = await this.notifications.list();
    return { notifications: notifications.map(presentNotification), unread };
  }

  /** Une notification ouverte, ou toutes (« Tout marquer comme lu ») ; rien n'est effacé. */
  @Post('notifications/read')
  @HttpCode(204)
  async read(@Body() body: unknown): Promise<void> {
    await this.notifications.markRead(parseBody(readSchema, body ?? {}).id);
  }

  /**
   * L'onglet Bosco du poste se dit au premier plan : une notification y arrive en message bref au lieu de la
   * notification du bureau (E15b). Réservé au poste : le téléphone n'en dit rien.
   */
  @Post('presence')
  @HttpCode(204)
  presenceOf(@Body() body: unknown): void {
    this.presence.report(parseBody(presenceSchema, body).foreground);
  }
}
