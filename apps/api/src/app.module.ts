import { type DynamicModule, Module } from '@nestjs/common';
import type { Config } from './config.ts';
import { AccessModule } from './access/access.module.ts';
import { ContextModule } from './context/context.module.ts';
import { IsolationModule } from './isolation/isolation.module.ts';
import { PersistenceModule } from './persistence.module.ts';
import { ProjectsWiring } from './projects-wiring.ts';
import { ProjectsModule } from './projects/projects.module.ts';
import { SandboxWiring } from './sandbox-wiring.ts';
import { SessionsModule } from './sessions/sessions.module.ts';
import { HealthController } from './shared/interface/http/health.controller.ts';
import { CONFIG } from './shared/tokens.ts';
import { TestController } from './test.controller.ts';

/** Point de composition : relie chaque port à son adaptateur. Les contextes y arrivent lot par lot. */
@Module({})
export class AppModule {
  static forRoot(config: Config): DynamicModule {
    return {
      module: AppModule,
      global: true,
      imports: [PersistenceModule, SessionsModule, ProjectsModule, AccessModule, ContextModule, IsolationModule],
      controllers: [HealthController, ...(config.testing ? [TestController] : [])],
      providers: [{ provide: CONFIG, useValue: config }, SandboxWiring, ProjectsWiring],
      exports: [CONFIG],
    };
  }
}
