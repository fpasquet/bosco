import { type DynamicModule, Module } from '@nestjs/common';
import type { Config } from './config.ts';
import { HealthController } from './adapters/in/http/health.controller.ts';
import { TestController } from './adapters/in/http/test.controller.ts';
import { PersistenceModule } from './adapters/out/persistence/persistence.module.ts';
import { CONFIG } from './tokens.ts';

/** Point de composition : relie chaque port à son adaptateur. Les contextes y arrivent lot par lot. */
@Module({})
export class AppModule {
  static forRoot(config: Config): DynamicModule {
    return {
      module: AppModule,
      global: true,
      imports: [PersistenceModule],
      controllers: [HealthController, ...(config.testing ? [TestController] : [])],
      providers: [{ provide: CONFIG, useValue: config }],
      exports: [CONFIG],
    };
  }
}
