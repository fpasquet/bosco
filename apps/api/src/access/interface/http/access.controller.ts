import type { ServerResponse } from 'node:http';
import { Body, Controller, Delete, Get, Headers, HttpCode, Inject, Param, Post, Put, Res } from '@nestjs/common';
import { z } from 'zod';
import type { AccessService, AccessStatus } from '../../application/access.service.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { PAIRING_CODE } from '../../domain/pairing-code.ts';
import { DEVICE_COOKIE } from '../../infrastructure/phone/https-phone-listener.ts';
import { ACCESS_SERVICE } from '../../tokens.ts';

const enableSchema = z.object({ enabled: z.boolean() }).strict();
const claimSchema = z.object({ code: z.string().min(1).max(20) }).strict();

/** Le jeton dure un an ; le retirer de la liste des téléphones coupe son accès aussitôt. */
const DEVICE_TOKEN_MAX_AGE_S = 365 * 24 * 60 * 60;

interface DeviceDto {
  id: string;
  name: string;
  pairedAt: string;
}

/** Nom lisible d'un téléphone d'après son navigateur : « Android · Samsung Internet », « iPhone · Safari ». */
function deviceName(userAgent: string | undefined): string {
  const agent = userAgent ?? '';
  // Le plus précis d'abord : un navigateur Android se déclare aussi « Linux »
  const system =
    ['iPhone', 'iPad', 'Android', 'Windows', 'Mac OS', 'Linux'].find((name) => agent.includes(name)) ?? 'Téléphone';
  // Samsung Internet et Edge se déclarent aussi « Chrome » : ils passent avant lui
  const browser = /SamsungBrowser|Firefox|Edg|Chrome|Safari/.exec(agent)?.[0] ?? 'navigateur';
  const names: Record<string, string> = { Edg: 'Edge', SamsungBrowser: 'Samsung Internet' };
  return `${system.replace('Mac OS', 'macOS')} · ${names[browser] ?? browser}`;
}

/** Accès depuis le téléphone (E4c) : activation, code d'appairage, téléphones appairés (RF-SESS-07). */
@Controller('api')
export class AccessController {
  constructor(@Inject(ACCESS_SERVICE) private readonly access: AccessService) {}

  @Get('phone-access')
  status(): Promise<AccessStatus> {
    return this.access.status();
  }

  @Put('phone-access')
  async setEnabled(@Body() body: unknown): Promise<AccessStatus> {
    const { enabled } = parseBody(enableSchema, body);
    return enabled ? this.access.enable() : this.access.disable();
  }

  /** Nouveau code : 6 chiffres, valable 5 minutes et une seule fois ; l'ancien ne vaut plus (CA-SESS-66, 67). */
  @Post('pairing/code')
  issueCode(): { attempts: number; code: string; expiresAt: string } {
    const { code, expiresAt } = this.access.issueCode();
    return { code, expiresAt: expiresAt.toISOString(), attempts: PAIRING_CODE.attempts };
  }

  /** Le téléphone saisit le code ; accepté, il reçoit son jeton dans un cookie réservé à HTTPS (CA-SESS-68). */
  @Post('pairing/claim')
  async claim(
    @Body() body: unknown,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) reply: { raw: ServerResponse; status: (code: number) => unknown },
  ): Promise<{ result: string }> {
    const { code } = parseBody(claimSchema, body);
    const { result, token } = await this.access.claim(code, deviceName(userAgent));
    if (!token) {
      reply.status(result === 'wrong' ? 400 : 410);
      return { result };
    }
    reply.raw.setHeader(
      'set-cookie',
      `${DEVICE_COOKIE}=${encodeURIComponent(token)}; Max-Age=${DEVICE_TOKEN_MAX_AGE_S}; Path=/; HttpOnly; Secure; SameSite=Strict`,
    );
    return { result };
  }

  @Get('devices')
  async devices(): Promise<{ devices: DeviceDto[] }> {
    const devices = await this.access.listDevices();
    return { devices: devices.map(({ id, name, pairedAt }) => ({ id, name, pairedAt: pairedAt.toISOString() })) };
  }

  @Delete('devices/:id')
  @HttpCode(204)
  async revoke(@Param('id') id: string): Promise<void> {
    await this.access.revoke(id);
  }
}
