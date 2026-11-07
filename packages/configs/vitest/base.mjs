// Réglages Vitest communs ; chaque paquet les étend avec mergeConfig.
import { defineConfig } from 'vitest/config';

export const base = defineConfig({
  test: { include: ['src/**/*.test.ts', 'test/**/*.test.ts'], passWithNoTests: false, restoreMocks: true },
});

// Paquets NestJS et MikroORM : décorateurs « legacy » et leurs métadonnées, réglés explicitement (DT-18).
export const nest = defineConfig({
  ...base,
  oxc: { decorator: { legacy: true, emitDecoratorMetadata: true } },
});
