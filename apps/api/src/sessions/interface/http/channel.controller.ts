import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Inject,
  type MessageEvent,
  NotFoundException,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { Observable } from 'rxjs';
import { z } from 'zod';
import type { ChannelProfileDto } from '@bosco/domain';
import type { ChannelInstaller, ChannelService } from '../../application/channel.service.ts';
import type { SourceService } from '../../application/source.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { CHANNEL_INSTALLER, CHANNEL_SERVICE, HOOK_SECRET, SOURCE_SERVICE } from '../../tokens.ts';

const profileSchema = z.object({ path: z.string().min(1) });

/**
 * Canal de Bosco (E2i, E4f) : le flux qu'ouvre chaque session du terminal lancée avec le canal, et son installation
 * dans les profils. Le flux exige le secret de l'installation, comme l'entrée des hooks ; il reste sur le poste.
 */
@Controller('api/channel')
export class ChannelController {
  constructor(
    @Inject(CHANNEL_SERVICE) private readonly channel: ChannelService,
    @Inject(CHANNEL_INSTALLER) private readonly installer: ChannelInstaller,
    @Inject(SOURCE_SERVICE) private readonly sources: SourceService,
    @Inject(HOOK_SECRET) private readonly secret: string,
  ) {}

  /** Flux d'une session lancée avec le canal : chaque message écrit dans Bosco, à pousser dans son terminal. */
  @Sse('stream')
  stream(
    @Query('session') sessionId: string | undefined,
    @Headers('authorization') authorization: string | undefined,
  ): Observable<MessageEvent> {
    this.authenticate(authorization);
    if (!sessionId) throw new NotFoundException({ code: 'unknownSession' });
    return new Observable<MessageEvent>((subscriber) =>
      this.channel.connect(sessionId, (text) => subscriber.next({ type: 'message', data: { text } })),
    );
  }

  /** Profils surveillés et leur canal : installé ou non, et la commande qui lance une session avec lui (E4f). */
  @Get('profiles')
  async profiles(): Promise<{ profiles: ChannelProfileDto[] }> {
    const { sources } = await this.sources.listSources();
    const profiles = await Promise.all(
      sources
        .filter((source) => source.watched)
        .map(async (source) => {
          const installed = await this.installer.isInstalled(source.path);
          return {
            command: this.installer.launchCommand(source.path),
            installed,
            label: source.label,
            path: source.path,
          };
        }),
    );
    return { profiles };
  }

  @Post('profiles')
  @HttpCode(204)
  async install(@Body() body: unknown): Promise<void> {
    const { path } = parseBody(profileSchema, body);
    await this.watched(path);
    await this.installer.install(path);
  }

  @Delete('profiles')
  @HttpCode(204)
  async uninstall(@Query('path') path: string | undefined): Promise<void> {
    if (!path) throw new NotFoundException({ code: 'unknownSource' });
    await this.watched(path);
    await this.installer.uninstall(path);
  }

  private async watched(path: string): Promise<void> {
    const { sources } = await this.sources.listSources();
    if (!sources.some((source) => source.path === path)) throw new NotFoundException({ code: 'unknownSource' });
  }

  private authenticate(authorization: string | undefined): void {
    const expected = Buffer.from(`Bearer ${this.secret}`);
    const given = Buffer.from(authorization ?? '');
    if (given.length !== expected.length || !timingSafeEqual(given, expected))
      throw new ForbiddenException({ code: 'invalidHookSecret' });
  }
}
