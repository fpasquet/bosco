import { defineConfig, mergeConfig } from 'vitest/config';
import { base } from '@bosco/configs/vitest';

// Lecture des releases GitHub ; les pages elles-mêmes se vérifient par l'export statique (make docs-build)
export default mergeConfig(base, defineConfig({ test: { include: ['src/**/*.test.ts'] } }));
