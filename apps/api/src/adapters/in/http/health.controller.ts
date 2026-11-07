import { Controller, Get } from '@nestjs/common';
import { APP_NAME } from '@bosco/core/shared';

@Controller('api')
export class HealthController {
  @Get('health')
  health(): { name: string; status: 'ok' } {
    return { name: APP_NAME, status: 'ok' };
  }
}
